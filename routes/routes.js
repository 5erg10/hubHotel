const router = require('express').Router();
const sessionController = require('../controllers/sessionController');

router.route('/newSessionUser')
    .post(sessionController.addNewUser);

router
    .get('/user/list', sessionController.usersList);

module.exports = router;