const express = require('express');
const authController = require('../controllers/auth');
const path = require('path')
const multer = require('multer')

const router = express.Router();


//Multer
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const randomString = generateRandomString(5);
        const currentDate = Date.now();
        const originalExtension = path.extname(file.originalname);
        const modifiedFilename = `${currentDate}-${randomString}${originalExtension}`;
        cb(null, modifiedFilename);
    }
});

const upload = multer({ storage });


router.post('/register', authController.register);

router.post('/login', authController.login);

// Route handler for logout
router.post('/logout', authController.logout);

router.post('/post', upload.single('image'), authController.postMessage); 

router.post('/comment', upload.single('image'), authController.postComment);

router.post('/LikeDislike' , authController.likeDislikeMessage)

router.post('/UpdateEmail',  authController.UpdateEmail);

router.post('/ProfilPic', upload.single('image'), authController.ProfilPic)

router.post('/Delete', authController.Delete)

router.post('/AdminDelete', authController.AdminDelete)

router.post('/AdminEdit' , authController.AdminEdit)

router.post('/admin', authController.AllUser)

router.post('/DeleteMessage', authController.DeleteMessage)

router.post('/DeleteComment', authController.DeleteComment)

router.post('/EditMessage',upload.single('image'), authController.EditMessage)





module.exports = router;
