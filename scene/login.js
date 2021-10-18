userList = [];

fetch('/user/list').then(response => 
  response.json().then(data => {
    console.log('data: ',data);
    userList = data;
  })
);

function checkIfUserExists(input) {
  const user = input.value;
  if(user == '') {
    configAvatar.setAttribute('disabled', 'true');
    document.getElementById('userNameAdvice').innerHTML = 'Debes introducir un nombre de usuario'
  } else if (userList.find(item => item.name === user)) {
    configAvatar.setAttribute('disabled', 'true');
    document.getElementById('userNameAdvice').innerHTML = 'Este nombre ya se esta usando, elige otro'
  } else {
    configAvatar.setAttribute('disabled', '');
    document.getElementById('userNameAdvice').innerHTML = ''
  }
}