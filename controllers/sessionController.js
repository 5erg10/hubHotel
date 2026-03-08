const User = require('../modelos/newUser');

const sessions = {};
let usersLength = 0;

const usersList = (req, res) => {
  try {
    setTimeout(() => {
      res.status(200).json(Object.keys(sessions));
    }, 3000);
  } catch(err) {
    res.status(400).json({
        message: "Error obteniendo lista de usuarios",
        errors: err.errors
    });
  }
};

const addNewUser = async (req, res) => {
  try {
    req.body.timestamp = Date.now();
    const userValidation = await (new User(req.body)).validate();
    sessions[req.body.userName] = req.body;
    res.status(200).json({ message: "Datos Guardados" });
  } catch(err) {
    console.log('error saving unser on session: ', err);
    res.status(400).json({
        message: "Error de validación",
        errors: err.errors
    });
  }
};

const removeUser = (data) => {
  delete sessions[data.userName];
};

const recoverUsers = () => {
  return sessions;
};

const refreshUserPosition = (data) => {
  if(sessions[data.userName]) {
    sessions[data.userName].position = data.position;
  }
}

const expireSessions = (io) => {
  const keys = Object.keys(sessions);

  if (keys.length !== usersLength) {
    usersLength = keys.length;
    console.log('Connected users: ');
    console.log('\t' + Object.keys(sessions).join(' '));
  }
  setTimeout(() => expireSessions(io), 3000);
}

module.exports = {
  usersList,
  addNewUser,
  removeUser,
  expireSessions,
  refreshUserPosition,
  recoverUsers
}