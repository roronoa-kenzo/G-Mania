const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { validationResult } = require('express-validator');
const { log } = require("console");
const session = require('express-session');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    charset: 'utf8mb4'
});

//~Jolie Regex~ 
const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*\s).{12,}$/;

// Register Et Regex Nickel
exports.register = (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    // Vérification de la validité de l'email
    if (!emailRegex.test(email)) {
        return res.render('index', {
            message: 'Format d\'e-mail invalide',
        });
    }

    // Vérification de la force du mot de passe
    if (!passwordRegex.test(password)) {
        return res.render('index', {
            message: 'Le mot de passe doit contenir au moins 12 caractères, une lettre majuscule, une lettre minuscule, un caractère spécial et un chiffre',
        });
    }
    

    // Vérification de la correspondance entre le mot de passe et sa confirmation
    if (password !== passwordConfirm) {
        return res.render('index', {
            message: 'Les mots de passe ne correspondent pas',
        });
    }

    db.query('SELECT UserEmail FROM users WHERE UserEmail = ?', email, async (error, results) => {
        if (error) {
            console.log(error);
            return res.render('index', {
                message: 'Erreur lors de la vérification de l\'e-mail',
            });
        }

        if (results.length > 0) {
            return res.render('index', {
                message: 'Cet e-mail est déjà utilisé',
            });
        } else {
            try {
                let hashedPassword = await bcryptjs.hash(password, 8);
                db.query('INSERT INTO users SET ?', { UserName: name, UserEmail: email, UserPassword: hashedPassword }, (error, results) => {
                    if (error) {
                        console.log(error);
                        return res.render('index', {
                            message: 'Erreur lors de l\'enregistrement de l\'utilisateur',
                        });
                    }
                    return res.render('index', {
                        messages: 'Utilisateur enregistré',
                    });
                });
            } catch (error) {
                console.log(error);
                return res.render('index', {
                    message: 'Erreur lors du hachage du mot de passe',
                });
            }
        }
    });
};

//Login et Stockage dans la session
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('index', {
        message: 'Please fill in all fields',
      });
    }

    db.query('SELECT * FROM users WHERE UserEmail = ?', [email], async (error, results) => {
      if (!results || results.length === 0) {
        res.status(401).render('index', {
          message: 'Email or Password incorrect',
        });
      } else {
        const isPasswordMatch = await bcryptjs.compare(password, results[0].UserPassword);

        if (isPasswordMatch) {
          const id = results[0].idUser;

          const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });

          // Store the token in the session
          req.session.token = token;

          // Store the success message in the session
          req.session.message = 'Login successful';

          // Redirect to the index page
          res.status(200).redirect('/');
        } else {
          res.status(401).render('index', {
            message: 'Email or Password incorrect',
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};


// Verification Du Stockage en Session du tokken
exports.isLoggedIn = async (req, res, next) => {
    if (req.session.token) {
        try {
            // Verify the token
            const decoded = await promisify(jwt.verify)(req.session.token, process.env.JWT_SECRET);

            // Find the user using your custom MySQL query
            db.query('SELECT * FROM users WHERE idUser = ?', [decoded.id], (error, result) => {
                if (!result || result.length === 0) {
                    return next();
                }

                // Set req.user to the user retrieved from the database
                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
};

exports.isLoggedInAsAdmin = async (req, res, next) => {
  if (req.session.token) {
    try {
      // Verify the token
      const decoded = await promisify(jwt.verify)(req.session.token, process.env.JWT_SECRET);

      // Find the user using your custom MySQL query
      db.query('SELECT * FROM users WHERE idUser = ?', [decoded.id], (error, result) => {
        if (!result || result.length === 0) {
          return next();
        }

        // Check if the user has the role of "admin"
        if (result[0].UserRoles === 'admin') {
          // Set req.user to the user retrieved from the database
          req.admin = result[0];
        }
        return next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};


// Logout via un Post de User
exports.logout = (req, res) => {
  // Clear the session token
  req.session.token = null;

  // Store the success message in the session
  req.session.message = 'Logout successful';

  // Redirect to the homepage or any desired route
  res.status(200).redirect('/');
};

//Meesage Without Socket.io
exports.postMessage = async (req, res) => {
    try {
      const { messageText } = req.body;
      const userId = req.query.userId;
      const imageFile = req.file;

      if (!userId) {
        req.session.message = 'Connectez Vous';
        return res.redirect('/');
      }
  
      if (messageText && imageFile) {
        db.query(
          'INSERT INTO messages (MessageText, MessageDate, idUser, MessageImage) VALUES (?, NOW(), ?, ?)',
          [messageText, userId, imageFile.filename],  
          (error) => {
            if (error) {
              console.log(error);
              req.session.message = 'Error saving the message';
              return res.redirect('/');
            }
  
            req.session.message = 'Message posted successfully';
            res.status(200).redirect('/');
          }
        );
      } else if (messageText) {
        db.query(
          'INSERT INTO messages (MessageText, MessageDate, idUser) VALUES (?, NOW(), ?)',
          [messageText, userId],
          (error) => {
            if (error) {
              console.log(error);
              req.session.message = 'Error saving the message';
              return res.redirect('/');
            }
  
            req.session.messages = 'Message posted successfully';
            return res.redirect('/');
          }
        );
      } else if (imageFile) {
        // Image message only
        // Save the message to the database with the user's ID and image filename
        db.query(
          'INSERT INTO messages (MessageDate, idUser, MessageImage) VALUES (NOW(), ?, ?)',
          [userId, imageFile.filename],
          (error) => {
            if (error) {
              console.log(error);
              req.session.message = 'Error saving the message';
              return res.redirect('/');
            }
  
            req.session.messages = 'Message posted successfully';
            return res.redirect('/');
          }
        ); 
      } else {
        req.session.message = 'Please enter a message or upload an image';
        return res.redirect('/');
      }
    } catch (error) {
      console.log(error);
      req.session.message = 'Error posting the message';
      return res.redirect('/');
    }
};


exports.fetchMessages = async (req, res, next) => {
  try {
    // Fetch messages from the database with user information, including User.Roles
    db.query(
      'SELECT m.idMessage, m.MessageText, m.MessageDate, m.MessageImage, u.UserName, u.UserProfileImage, u.UserRoles, u.idUser FROM messages m JOIN users u ON m.idUser = u.idUser ORDER BY m.idMessage DESC',
      (error, results) => {
        if (error) {
          console.log(error);
          req.session.message = 'Failed to fetch messages';
          return res.redirect('/');
        }

        // Store the fetched messages in the session
        const socketmessages = results.map((message) => {
          const currentDate = new Date();
          const messageDate = new Date(message.MessageDate);
          const timeDifference = currentDate.getTime() - messageDate.getTime();
          const seconds = Math.floor(timeDifference / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          let formattedDate = '';

          if (days > 0) {
            formattedDate = `Envoyé le ${messageDate.toLocaleDateString()}`;
          } else if (hours > 0) {
            formattedDate = `Envoyé il y a ${hours} heure(s)`;
          } else if (minutes > 0) {
            formattedDate = `Envoyé il y a ${minutes} minute(s)`;
          } else {
            formattedDate = `Envoyé il y a ${seconds} seconde(s)`;
          }

          return {
            SocketMessage: message.MessageText,
            idMessage: message.idMessage,
            idUser: message.idUser,
            MessageDate: formattedDate,
            MessageImage: message.MessageImage,
            UserName: message.UserName,
            UserProfileImage: message.UserProfileImage,
            UserRoles: message.UserRoles,
          };
        });

        req.session.socketmessages = socketmessages;
        // console.log(req.session.socketmessages);
        next();
      }
    );
  } catch (error) {
    console.log(error);
    req.session.message = 'Failed to fetch messages';
    res.redirect('/');
  }
};

//Sans Image
// exports.postComment = async (req, res) => {
//   try {
//     const { commentText, userId, messageId } = req.body;
//     if (!userId || !messageId) {
//       req.session.message = "Veuillez fournir un identifiant d'utilisateur et un identifiant de message";
//       return res.redirect("/");
//     }

//     if (!commentText.trim()) {
//       req.session.message = "Veuillez entrer un commentaire";
//       return res.redirect("/");
//     }

//     // Save the comment to the database with the user's ID, message ID, and comment text
//     db.query(
//       "INSERT INTO commentaires (PostTexte, PostDate, idUser, idMessage) VALUES (?, NOW(), ?, ?)",
//       [commentText, userId, messageId],
//       (error) => {
//         if (error) {
//           console.log(error);
//           req.session.message = "Erreur lors de la sauvegarde du commentaire";
//           return res.redirect("/");
//         }

//         req.session.message = "Commentaire ajouté avec succès";
//         res.redirect("/");
//       }
//     );
//   } catch (error) {
//     console.log(error);
//     req.session.message = "Erreur lors de l'ajout du commentaire";
//     res.redirect("/");
//   }
// };

exports.postComment = async (req, res) => {
  try {
    const { commentText, userId, messageId } = req.body;
    const imageFile = req.file;
    console.log(req.file);

    if (!userId || !messageId) {
      req.session.message = "Veuillez fournir un identifiant d'utilisateur et un identifiant de message";
      return res.redirect("/");
    }

    if (!commentText.trim()) {
      req.session.message = "Veuillez entrer un commentaire";
      return res.redirect("/");
    }

    if (commentText && imageFile) {
      db.query(
        "INSERT INTO commentaires (PostTexte, PostDate, idUser, idMessage, PostImg) VALUES (?, NOW(), ?, ?, ?)",
        [commentText, userId, messageId, imageFile.filename],
        (error) => {
          if (error) {
            console.log(error);
            req.session.message = "Erreur lors de la sauvegarde du commentaire";
            return res.redirect("/");
          }

          req.session.message = "Commentaire ajouté avec succès";
          res.redirect("/");
        }
      );
    } else if (commentText) {
      db.query(
        "INSERT INTO commentaires (PostTexte, PostDate, idUser, idMessage) VALUES (?, NOW(), ?, ?)",
        [commentText, userId, messageId],
        (error) => {
          if (error) {
            console.log(error);
            req.session.message = "Erreur lors de la sauvegarde du commentaire";
            return res.redirect("/");
          }

          req.session.message = "Commentaire ajouté avec succès";
          res.redirect("/");
        }
      );
    } else if (imageFile) {
      req.session.message = "Veuillez entrer un commentaire";
      return res.redirect("/");
    } else {
      req.session.message = "Veuillez entrer un commentaire";
      return res.redirect("/");
    }
  } catch (error) {
    console.log(error);
    req.session.message = "Erreur lors de l'ajout du commentaire";
    res.redirect("/");
  }
};


exports.fetchComments = async (req, res, next) => {
  try {
    db.query(
      'SELECT c.idComment, c.PostTexte, c.PostDate, c.PostImg, c.idMessage, c.idUser, u.UserName, u.UserProfileImage, u.UserRoles FROM commentaires c JOIN users u ON c.idUser = u.idUser ORDER BY c.idComment DESC',
      (error, results) => {
        if (error) {
          console.log(error);
          req.session.message = 'Failed to fetch comments';
          return res.redirect('/');
        }

        // Store the fetched comments in the session
        const socketComments = results.map((comment) => {
          const currentDate = new Date();
          const commentDate = new Date(comment.PostDate);
          const timeDifference = currentDate.getTime() - commentDate.getTime();
          const seconds = Math.floor(timeDifference / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          let formattedDate = '';

          if (days > 0) {
            formattedDate = `Posted on ${commentDate.toLocaleDateString()}`;
          } else if (hours > 0) {
            formattedDate = `Posted ${hours} hour(s) ago`;
          } else if (minutes > 0) {
            formattedDate = `Posted ${minutes} minute(s) ago`;
          } else {
            formattedDate = `Posted ${seconds} second(s) ago`;
          }

          return {
            SocketComment: comment.PostTexte,
            idComment: comment.idComment,
            idMessage: comment.idMessage,
            CommentDate: formattedDate,
            PostImg: comment.PostImg, 
            UserName: comment.UserName,
            UserProfileImage: comment.UserProfileImage,
            UserRoles: comment.UserRoles,
            UserId: comment.idUser,
          };
        });

        req.session.socketComments = socketComments;
        next();
      }
    );
  } catch (error) {
    console.log(error);
    req.session.message = 'Failed to fetch comments';
    res.redirect('/');
  }
};


//Sans Image
// exports.fetchComments = async (req, res, next) => {
//   try {
//     // Fetch comments from the database with user information, including User.Roles and idMessage
//     db.query(
//       'SELECT c.idComment, c.PostTexte, c.PostDate, c.idMessage, u.UserName, u.UserProfileImage, u.UserRoles FROM commentaires c JOIN users u ON c.idUser = u.idUser ORDER BY c.idComment DESC',
//       (error, results) => {
//         if (error) {
//           console.log(error);
//           req.session.message = 'Failed to fetch comments';
//           return res.redirect('/');
//         }

//         // Store the fetched comments in the session
//         const socketComments = results.map((comment) => {
//           const currentDate = new Date();
//           const commentDate = new Date(comment.PostDate);
//           const timeDifference = currentDate.getTime() - commentDate.getTime();
//           const seconds = Math.floor(timeDifference / 1000);
//           const minutes = Math.floor(seconds / 60);
//           const hours = Math.floor(minutes / 60);
//           const days = Math.floor(hours / 24);

//           let formattedDate = '';

//           if (days > 0) {
//             formattedDate = `Posted on ${commentDate.toLocaleDateString()}`;
//           } else if (hours > 0) {
//             formattedDate = `Posted ${hours} hour(s) ago`;
//           } else if (minutes > 0) {
//             formattedDate = `Posted ${minutes} minute(s) ago`;
//           } else {
//             formattedDate = `Posted ${seconds} second(s) ago`;
//           }

//           return {
//             SocketComment: comment.PostTexte,
//             idComment: comment.idComment,
//             idMessage: comment.idMessage,
//             CommentDate: formattedDate,
//             UserName: comment.UserName,
//             UserProfileImage: comment.UserProfileImage,
//             UserRoles: comment.UserRoles,
//           };
//         });

//         req.session.socketComments = socketComments;
//         next();
//       }
//     );
//   } catch (error) {
//     console.log(error);
//     req.session.message = 'Failed to fetch comments';
//     res.redirect('/');
//   }
// };


exports.likeDislikeMessage = async (req, res) => {
  const { userId, messageId, action } = req.body;

  try {
    if (action === 'like') {
      // Handle the like action
      const dislikeCheckQuery = 'SELECT * FROM dislikes WHERE UserDislike = ? AND PostDislike = ?';
      db.query(dislikeCheckQuery, [userId, messageId], (dislikeCheckError, dislikeCheckResults) => {
        if (dislikeCheckError) {
          console.log(dislikeCheckError);
          req.session.message = 'Failed to check dislike status';
          return res.redirect('/');
        }

        if (dislikeCheckResults.length > 0) {
          // User already disliked the message, remove the dislike
          const removeDislikeQuery = 'DELETE FROM dislikes WHERE UserDislike = ? AND PostDislike = ?';
          db.query(removeDislikeQuery, [userId, messageId], (removeDislikeError) => {
            if (removeDislikeError) {
              console.log(removeDislikeError);
              req.session.message = 'Failed to remove dislike';
              return res.redirect('/');
            }

            // User has now removed the dislike and can add the like
            const addLikeQuery = 'INSERT INTO likes (UserLike, PostLike) VALUES (?, ?)';
            db.query(addLikeQuery, [userId, messageId], (addLikeError) => {
              if (addLikeError) {
                console.log(addLikeError);
                req.session.message = 'Failed to add like';
                return res.redirect('/');
              }

              req.session.message = 'Like added successfully';
              return res.redirect('/');
            });
          });
        } else {
          // User has not disliked the message, check if they have already liked it
          const likeCheckQuery = 'SELECT * FROM likes WHERE UserLike = ? AND PostLike = ?';
          db.query(likeCheckQuery, [userId, messageId], (likeCheckError, likeCheckResults) => {
            if (likeCheckError) {
              console.log(likeCheckError);
              req.session.message = 'Failed to check like status';
              return res.redirect('/');
            }

            if (likeCheckResults.length > 0) {
              // User already liked the message, remove the like
              const removeLikeQuery = 'DELETE FROM likes WHERE UserLike = ? AND PostLike = ?';
              db.query(removeLikeQuery, [userId, messageId], (removeLikeError) => {
                if (removeLikeError) {
                  console.log(removeLikeError);
                  req.session.message = 'Failed to remove like';
                  return res.redirect('/');
                }

                req.session.message = 'Like removed successfully';
                return res.redirect('/');
              });
            } else {
              // User has not liked the message, add the like
              const addLikeQuery = 'INSERT INTO likes (UserLike, PostLike) VALUES (?, ?)';
              db.query(addLikeQuery, [userId, messageId], (addLikeError) => {
                if (addLikeError) {
                  console.log(addLikeError);
                  req.session.message = 'Failed to add like';
                  return res.redirect('/');
                }

                req.session.message = 'Like added successfully';
                return res.redirect('/');
              });
            }
          });
        }
      });
    } else if (action === 'dislike') {
      // Handle the dislike action
      const likeCheckQuery = 'SELECT * FROM likes WHERE UserLike = ? AND PostLike = ?';
      db.query(likeCheckQuery, [userId, messageId], (likeCheckError, likeCheckResults) => {
        if (likeCheckError) {
          console.log(likeCheckError);
          req.session.message = 'Failed to check like status';
          return res.redirect('/');
        }

        if (likeCheckResults.length > 0) {
          // User already liked the message, remove the like
          const removeLikeQuery = 'DELETE FROM likes WHERE UserLike = ? AND PostLike = ?';
          db.query(removeLikeQuery, [userId, messageId], (removeLikeError) => {
            if (removeLikeError) {
              console.log(removeLikeError);
              req.session.message = 'Failed to remove like';
              return res.redirect('/');
            }

            // User has now removed the like and can add the dislike
            const addDislikeQuery = 'INSERT INTO dislikes (UserDislike, PostDislike) VALUES (?, ?)';
            db.query(addDislikeQuery, [userId, messageId], (addDislikeError) => {
              if (addDislikeError) {
                console.log(addDislikeError);
                req.session.message = 'Failed to add dislike';
                return res.redirect('/');
              }

              req.session.message = 'Dislike added successfully';
              return res.redirect('/');
            });
          });
        } else {
          // User has not liked the message, check if they have already disliked it
          const dislikeCheckQuery = 'SELECT * FROM dislikes WHERE UserDislike = ? AND PostDislike = ?';
          db.query(dislikeCheckQuery, [userId, messageId], (dislikeCheckError, dislikeCheckResults) => {
            if (dislikeCheckError) {
              console.log(dislikeCheckError);
              req.session.message = 'Failed to check dislike status';
              return res.redirect('/');
            }

            if (dislikeCheckResults.length > 0) {
              // User already disliked the message, remove the dislike
              const removeDislikeQuery = 'DELETE FROM dislikes WHERE UserDislike = ? AND PostDislike = ?';
              db.query(removeDislikeQuery, [userId, messageId], (removeDislikeError) => {
                if (removeDislikeError) {
                  console.log(removeDislikeError);
                  req.session.message = 'Failed to remove dislike';
                  return res.redirect('/');
                }

                req.session.message = 'Dislike removed successfully';
                return res.redirect('/');
              });
            } else {
              // User has not disliked the message, add the dislike
              const addDislikeQuery = 'INSERT INTO dislikes (UserDislike, PostDislike) VALUES (?, ?)';
              db.query(addDislikeQuery, [userId, messageId], (addDislikeError) => {
                if (addDislikeError) {
                  console.log(addDislikeError);
                  req.session.message = 'Failed to add dislike';
                  return res.redirect('/');
                }

                req.session.message = 'Dislike added successfully';
                return res.redirect('/');
              });
            }
          });
        }
      });
    } else {
      req.session.message = 'Invalid action';
      return res.redirect('/');
    }
  } catch (error) {
    console.log(error);
    req.session.message = 'Failed to like/dislike message';
    return res.redirect('/');
  }
};

// Controller function to fetch like and dislike counts
exports.fetchLikeDislike = async (req, res , next) => {
  try {
    const likeQuery = 'SELECT likes.PostLike, COUNT(likes.PostLike) AS LikedCount FROM likes INNER JOIN messages ON likes.PostLike = messages.idMessage GROUP BY likes.PostLike';
    const dislikeQuery = 'SELECT dislikes.*, COUNT(dislikes.PostDislike) AS Disliked FROM dislikes INNER JOIN messages ON dislikes.PostDislike = messages.idMessage';

    db.query(likeQuery, (likeError, likeResults) => {
      if (likeError) {
        console.log(likeError);
        req.session.message = 'Failed to fetch likes';
        return res.redirect('/');
      }

      db.query(dislikeQuery, (dislikeError, dislikeResults) => {
        if (dislikeError) {
          console.log(dislikeError);
          req.session.message = 'Failed to fetch dislikes';
          return res.redirect('/');
        }

        req.session.likes = likeResults;
       
        req.session.dislikes = dislikeResults;
       
        next(); // Call the next middleware
      });
    });
  } catch (error) {
    console.log(error);
    req.session.message = 'Failed to fetch like/dislike data';
    return res.redirect('/');
  }
};

exports.AdminDelete = async (req, res) => {

  //Step 1 Get the UserId -_- 🤷 ET ARRETE D'ECRIRE ICI 
  const  UserId  = req.body.UserId;
  
    db.query('DELETE FROM users WHERE idUser = ?', UserId, (err, result) => {
      if(err){
      console.log(err)
      return res.status(500).render('admin', {
        message: 'Erreur lors du delete',
    });
    }
    else{
      return res.status(200).render('Succes');
    }
    })
};

exports.AdminEdit = async (req, res) => {
  try {
    const { UserId, name, email, password, role } = req.body;

    if (!name && !email && !password && !role) {
      return res.status(400).render('Succes');
    }

    try {
      // Fetch the user to be edited from the database
      db.query('SELECT * FROM users WHERE idUser = ?', UserId, async (error, result) => {
        if (error) {
          return res.status(500).render('Succes');
        } else {
          if (!result || result.length === 0) {
            return res.status(404).render('Succes', {
              message: 'Utilisateur introuvable',
            });
          }

          let updateQuery = '';
          const updateValues = [];

          if (name) {
            updateQuery += 'UserName = ?,';
            updateValues.push(name);
          }

          if (email) {
            updateQuery += 'UserEmail = ?,';
            updateValues.push(email);
          }

          if (password) {
            const salt = await bcryptjs.genSalt(8);
            const hashedPassword = await bcryptjs.hash(password, salt);
            updateQuery += 'UserPassword = ?,';
            updateValues.push(hashedPassword);
          }

          if (role && role === 'admin') {
            updateQuery += 'UserRoles = ?,';
            updateValues.push(role);
          } else {
            updateQuery += 'UserRoles = NULL,';
          }

          // Remove the trailing comma from updateQuery
          updateQuery = updateQuery.slice(0, -1);

          // Add the user ID to updateValues
          updateValues.push(UserId);

          // Perform the update operation in the database
          db.query('UPDATE users SET ' + updateQuery + ' WHERE idUser = ?', updateValues, (error, result) => {
            if (error) {
              return res.status(500).render('Succes');
            } else {
              return res.status(200).render('Succes');
            }
          });
        }
      });
    } catch (error) {
      return res.status(401).render('Succes');
    }
  } catch (error) {
    console.log(error);
  }
};

exports.CountUser = async (req, res, next) => {
  try {
    db.query('SELECT COUNT(*) AS userCount FROM users', (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Erreur lors du comptage des utilisateurs');
      } else {
        const userCount = results[0].userCount;
        req.userCount = userCount;
        next()
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send('Erreur lors du comptage des utilisateurs');
  }
};

exports.CountMessage = async (req, res, next) => {
  try {
    db.query('SELECT COUNT(*) AS CountMessage FROM messages', (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Erreur lors du comptage des messages');
      } else {
        const CountMessage = results[0].CountMessage;
        req.CountMessage = CountMessage;
        next()
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send('Erreur lors du comptage des messages');
  }
};


//Espace Kenzouille

//User Crud (Update Account & Delete Account)
exports.UpdateEmail = async (req, res) => {
  
  try {
    const { email, password } = req.body;

    if (!email && !password) {
    return res.status(400).render('edit', {
        message: 'Veuillez remplir au moins un champ',
    });
    }

    try {
    const decoded = await promisify(jwt.verify)(req.session.token, process.env.JWT_SECRET);
    const userId = decoded.id;

    db.query('SELECT * FROM users WHERE idUser = ?', [userId], async (error, result) => {
        if (error) {
        return res.status(500).render('edit', {
            message: 'Erreur lors de la mise à jour',
        });
        } else {
        if (!result) {
            return res.status(404).render('edit', {
            message: 'Utilisateur introuvable',
            });
        }

        let updateQuery = '';
        const updateValues = [];


        if (email) {
            updateQuery += 'UserEmail = ?,';
            updateValues.push(email);
        }

        if (password) {
            updateQuery += 'UserPassword = ?,';
            updateValues.push(password);
        }

        // Remove the trailing comma from updateQuery
        updateQuery = updateQuery.slice(0, -1);

        // Add the userId to updateValues
        updateValues.push(userId);

        // Perform the update operation in the database
        // Replace the code below with your actual update logic
        db.query('UPDATE users SET ' + updateQuery + ' WHERE idUser = ?', updateValues, (error, result) => {
            if (error) {
            return res.status(500).render('edit', {
                message: 'Erreur lors de la mise à jour',
            });
            } else {
            return res.status(200).render('edit', {
                message: 'Mise à jour réussie',
            });
            }
        });
        }
    });
    } catch (error) {
    return res.status(401).render('edit', {
        message: 'Accès non autorisé',
    });
    }
} catch (error) {
    console.log(error);
}
};

exports.ProfilPic = async (req, res) => {
  const { filename } = req.file;
  const { userId, userImg } = req.body;
  console.log(filename);
  console.log(userId);
  console.log(userImg);

  // Step 1: Check if there is an image
  if (!filename) {
    req.session.message = 'No image uploaded';
    return res.redirect('/');
  }

  // Step 2: Update the user's profile image
  db.query(
    'UPDATE users SET UserProfileImage = ? WHERE idUser = ?',
    [filename, userId],
    (error) => {
      if (error) {
        console.log(error);
        req.session.message = 'Error updating the profile picture';
        return res.redirect('/');
      }

      // Step 3: Delete the old image (assuming the previous image is stored in the 'public/uploads/' directory)
      if (userImg) {
        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', userImg);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.log(err);
            // Handle the error or log it if necessary
          }
        });
      }

      req.session.messages = 'Profile picture updated successfully';
      return res.redirect('/');
    }
  );
};

exports.Delete = async (req, res) => {

  //Step 1 Get the UserId -_- 🤷 ET ARRETE D'ECRIRE ICI 
  const  UserId  = req.body.UserId;
  console.log(UserId)
  //Step 1 Bonus Verifier que l'user a un tokken
  
  //Step 2 Bye Bye User Je me souviens pas qu'on a un champs id en bdd mais bon on va dire c'est la fatigue
    db.query('DELETE FROM users WHERE idUser = ?', UserId, (err, result) => {
      if(err){
      console.log(err)
      return res.status(500).render('edit', {
        message: 'Erreur lors du delete',
    });
    }
    else{
      return res.status(200).render('edit', {
        message: 'votre compte à été supprimer',
    });
    }
    })
};


exports.AllUser = async (req, res) => {

  try {
    // Fetch comments from the database with user information, including User.Roles and idMessage
    db.query('SELECT * FROM users', (error, results) => {
        if (error) {
          console.log(error);
          req.session.message = 'Failed to fetch comments';
          return res.redirect('/');
        }
      }
    );
  } catch (error) {
    console.log(error);
    req.session.message = 'Failed to fetch comments';
    res.redirect('/');
  }

};

// Verification Du Stockage en Session du tokken
exports.AllLoggedIn = async (req, res, next) => {
  if (req.session.token) {
    try {
      // Find all users using the MySQL query
      db.query('SELECT * FROM users', (error, result) => {
        if (error) {
          console.log(error);
          return next();
        }
        // Set req.AllUserExports to the users retrieved from the database
        req.AllUserExports = result;
        return next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.DeleteMessage = async (req, res) => {

  //Step 1 Get the UserId -_- 🤷 ET ARRETE D'ECRIRE ICI 
  const  UserId  = req.body.UserId;
  const messageId = req.body.messageId;
  console.log('------------------------', messageId)
  
  //Step 1 Bonus Verifier que l'user a un tokken
  
  //Step 2 Bye Bye User Je me souviens pas qu'on a un champs id en bdd mais bon on va dire c'est la fatigue
    db.query('DELETE FROM messages WHERE idMessage = ?', messageId, (error, result) => {
     if(error){ 
      console.log('----------- ERRRRRRRRRRRROOOOOORRRR-------------',error)
      req.session.token = null;

      // Store the success message in the session
      req.session.message = 'Delete Fail';

      // Redirect to the homepage or any desired route
      res.status(200).redirect('profile');
    }
    else{
      req.session.token = null;

      // Store the success message in the session
      req.session.message = 'Delete Success';

      // Redirect to the homepage or any desired route
      res.status(200).redirect('profile');
    }
   })
};

exports.EditMessage = async (req, res) => {
  try {
    const { userId, messageId, content } = req.body;
    const imageFile = req.file;

    if (!userId || !messageId) {
      req.session.message = 'Invalid request';
      return res.redirect('profile');
    }

    if (!content && !imageFile) {
      req.session.message = 'Please enter a message or upload an image';
      return res.redirect('profile');
    }

    let updateQuery = '';
    const updateValues = [];

    if (content) {
      updateQuery += 'MessageText = ?,';
      updateValues.push(content);
    }

    if (imageFile) {
      updateQuery += 'MessageImage = ?,';
      updateValues.push(imageFile.filename);
    }

    // Remove the trailing comma from updateQuery
    updateQuery = updateQuery.slice(0, -1);

    // Add the message ID and user ID to updateValues
    updateValues.push(messageId, userId);

    // Update the message in the database
    db.query(
      'UPDATE messages SET ' + updateQuery + ' WHERE idMessage = ? AND idUser = ?',
      updateValues,
      (error) => {
        if (error) {
          console.log(error);
          req.session.message = 'Error updating the message';
          return res.redirect('profile');
        }

        req.session.message = 'Message updated successfully';
        res.redirect('profile');
      }
    );
  } catch (error) {
    console.log(error);
    req.session.message = 'Error updating the message';
    return res.redirect('profile');
  }
};

exports.DeleteComment = async (req, res) => {  

  //Step 1 Get the UserId -_- 🤷 ET ARRETE D'ECRIRE ICI 
  const  UserId  = req.body.UserId;
  const commentId = req.body.commentId;
  console.log('------------------------', commentId)
  
  //Step 1 Bonus Verifier que l'user a un tokken
  
  //Step 2 Bye Bye User Je me souviens pas qu'on a un champs id en bdd mais bon on va dire c'est la fatigue
    db.query('DELETE FROM commentaires WHERE idComment = ?', commentId, (error, result) => {
     if(error){ 
      console.log('----------- ERRRRRRRRRRRROOOOOORRRR-------------',error)
      req.session.token = null;

      // Store the success message in the session
      req.session.message = 'Delete Fail';

      // Redirect to the homepage or any desired route
      res.status(200).redirect('index');
    }
    else{
      req.session.token = null;

      // Store the success message in the session
      req.session.message = 'Delete Success';

      // Redirect to the homepage or any desired route
      res.status(200).redirect('index');
    }
   })
};

















