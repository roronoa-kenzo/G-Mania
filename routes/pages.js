const express = require('express');
const { isLoggedIn, AllLoggedIn, fetchComments, GetUserMessages  , fetchLikeDislike , isLoggedInAsAdmin ,CountUser , CountMessage} = require('../controllers/auth');
const router = express.Router();
const { fetchMessages } = require('../controllers/auth');

// Route handler for the homepage
router.get('/', isLoggedIn , fetchMessages, fetchComments, fetchLikeDislike, isLoggedInAsAdmin,  (req, res) => {
  const messages = req.session.messages;
  req.session.messages = null; 

  const message = req.session.message;
  req.session.message = null; 
  
  const socketmessages = req.session.socketmessages;
  req.session.socketmessages = null;

  const socketComments = req.session.socketComments;
  req.session.socketComments = null;

  const likes = req.session.likes;
  req.session.likes = null;

  const dislikes = req.session.dislikes;
  req.session.dislikes = null;

  const admin = req.admin

  const user = req.user;
  res.render('index', { admin ,socketComments , socketmessages , message ,messages, user , likes, dislikes});
});

router.get('/test', fetchLikeDislike, (req, res) => {
  const likes = req.session.likes;
  req.session.likes = null;

  const dislikes = req.session.dislikes;
  req.session.dislikes = null;

  res.render('test', { likes, dislikes });
});


// 
router.get('/profile', isLoggedIn,  fetchComments, fetchMessages, (req, res) => {
  const messages = req.session.messages;
  req.session.messages = null; // Reset the message after retrieving it

  const message = req.session.message;
  req.session.message = null; 

  const socketmessages = req.session.socketmessages;
  req.session.socketmessages = null;

  const socketComments = req.session.socketComments;
  req.session.socketComments = null;

  const user = req.user;

  if (user) {
    res.render('profile', { messages, user, message, socketmessages, socketComments });
  } else {
    res.redirect('/');
  }
});


// 
router.get('/edit', isLoggedIn,(req, res) => {
  const messages = req.session.messages;
  req.session.messages = null; // Reset the message after retrieving it

  const user = req.user;

  if (user) {
    res.render('edit', { messages, user });
  } else {
    res.redirect('/');
  }
});

// 
router.get('/admin', AllLoggedIn, isLoggedIn, isLoggedInAsAdmin ,CountUser,CountMessage, fetchMessages,fetchComments,(req, res) => {
  const message = req.session.message;
  req.session.message = null; 

  const user = req.user;

  const admin = req.admin;

  const AllUser = req.AllUserExports ;

  const CountU = req.userCount 

  const CountM = req.CountMessage;

  const socketmessages = req.session.socketmessages;
  req.session.socketmessages = null;

  const socketComments = req.session.socketComments;
  req.session.socketComments = null;

  if (admin) {
    res.render('admin', { admin, user , AllUser ,message , CountU , CountM ,socketmessages,socketComments});
  } else {
    res.redirect('/');
  }
});

router.get('/Succes', isLoggedInAsAdmin, isLoggedIn, (req, res) => {
  const message = req.session.message;
  req.session.message = null; 

  const user = req.user;

  const admin = req.admin

  const AllUser = req.AllUserExports ;

  if (admin) {
    res.render('admin', {admin , user , AllUser ,message });
  } else {
    res.redirect('/');
  }
});

// 
router.get('/bookmarks', isLoggedIn,  fetchComments, fetchMessages, (req, res) => {
  const messages = req.session.messages;
  req.session.messages = null; // Reset the message after retrieving it

  const message = req.session.message;
  req.session.message = null; 

  const socketmessages = req.session.socketmessages;
  req.session.socketmessages = null;

  const socketComments = req.session.socketComments;
  req.session.socketComments = null;

  const user = req.user;

  if (user) {
    res.render('bookmarks', { messages, user, message, socketmessages, socketComments });
  } else {
    res.redirect('/');
  }
});



// C'est Magique
router.get('*', (req, res) => {
  res.redirect('/');
});

module.exports = router;
