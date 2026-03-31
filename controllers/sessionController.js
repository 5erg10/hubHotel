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

const expireSessions = (io) => {
  const now = Date.now();

  Object.keys(sessions).forEach(userName => {
    if (now - sessions[userName].timestamp > SESSION_TTL_MS) {
      const userData = sessions[userName];
      removeUser(userData);
      const officeUsers = Object.values(sessions).filter(u => u.office === userData.office);
      officeUsers.forEach(u => io.to(u.userName).emit('userLeave', userData));
      console.log(`Session expired: ${userName}`);
    }
  });

  const keys = Object.keys(sessions);
  if (keys.length !== usersLength) {
    usersLength = keys.length;
    console.log('Connected users: ', keys.join(' '));
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