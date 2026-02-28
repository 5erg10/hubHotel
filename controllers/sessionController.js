const sessions = {};
let usersLength = 0;

const addNewUser = (data) => {
  data.timestamp = Date.now();
  sessions[data.userName] = data;
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

const list = () => Object.keys(sessions);

module.exports = {
  addNewUser,
  removeUser,
  expireSessions,
  refreshUserPosition,
  list,
  recoverUsers
}