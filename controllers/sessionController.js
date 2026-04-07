const User = require('../modelos/newUser');

const sessions = {};
let usersLength = 0;

const usersList = (req, res) => {
  try {
    res.status(200).json(Object.keys(sessions));
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
  console.log('sessions: ', Object.keys(sessions).join(' '));
};

const recoverUsers = () => {
  return sessions;
};

const SESSION_TTL_MS = 30000;

const refreshUserPosition = (data) => {
  if(sessions[data.userName]) {
    sessions[data.userName].position = data.position;
    sessions[data.userName].rotation = data.rotation;
    sessions[data.userName].timestamp = Date.now();
  }
}

module.exports = {
  usersList,
  addNewUser,
  removeUser,
  refreshUserPosition,
  recoverUsers
}