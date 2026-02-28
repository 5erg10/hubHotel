const User = require('../modelos/newUser');

const index = (req, res) => {
    User.get((err, contacts) => {
        if (err) return res.json({status: "error", message: err,});
        res.json({
            data: contacts
        });
    });
};

const newUser = (req, res) => {
    let contact = new User();
    contact.userName = req.body.userName ? req.body.userName : "null";
    contact.userHead = req.body.userHead ? req.body.userHead : "null";
    contact.userBody = req.body.userBody ? req.body.userBody : "null";
    contact.office = req.body.office ? req.body.office : "null";
    contact.save((err) => {
        if (err) return res.json(err);
        res.json({
            message: 'New User created!',
            data: contact
        });
    });
};

const viewUsers = (req, res) => {
    User.findById(req.params.contact_id, (err, contact) => {
        if (err) return res.send(err);
        res.json({
            message: 'User details loading..',
            data: contact
        });
    });
};

const updateUser = (req, res) => {
    User.findById(req.params.contact_id, (err, contact) => {
        if (err) return res.send(err);
        contact.save((err) => {
            if (err) res.json(err);
            res.json({
                message: 'User Info updated',
                data: contact
            });
        });
    });
};

const deleteUser = (req, res) => {
    User.remove({_id: req.params.contact_id}, (err, contact) => {
        if (err) return res.send(err);
        res.json({
            status: "success",
            message: 'User deleted'
        });
    });
};

module.exports = {
    index,
    newUser,
    viewUsers,
    updateUser,
    deleteUser
}