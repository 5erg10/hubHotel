const router = require('express').Router();

const sessionController = require('../controllers/sessionController');
const dataController = require('../controllers/dataController.js');

router.get('/', function (req, res) {
    res.send("message from API");
});

router.route('/users')
    .get(dataController.index);

router.route('/newUser')
    .post(dataController.newUser);   

router.get('/user/list', (req, res) => {
    res.json(sessionController.list().map(item => ({
        name: item
    })));
});

module.exports = router;