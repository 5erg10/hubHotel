const router = require('express').Router();
const sessionController = require('../controllers/sessionController');
const dataController = require('../controllers/dataController.js');

router.get('/', function (req, res) {
    res.send("message from API");
});

// FOR MONGODB DATA PERSIST
router.route('/users')
    .get(dataController.index);

router.route('/newUser')
    .post(dataController.newUser);

// TEMPORAL DATA PERSIST
router.route('/newSessionUser')
    .post(sessionController.addNewUser);

router
    .get('/user/list', sessionController.usersList);

module.exports = router;