import config from "../config/config";

export const getUserList = () => {
    return new Promise((resolve, reject) => {
        fetch(`${config.dataSourceUrl}/user/list`).then(response => 
            response.json().then(data => {
                console.log('users list: ',data);
                resolve(data);
            })
        );
    });
}

/* userData: {userName, office, position, rotation, userHead, userBody } */
export const saveUser = (userData) => {
    return new Promise((resolve, reject) => {
        fetch(`${config.dataSourceUrl}/newSessionUser`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({...userData})
        })
        .then(response => response.json())
        .then(success => {
            console.log('user saved on session!!');
            return resolve();
        }).catch(err => reject(err));
    })
}

export const DataSource = {
    getUserList,
    saveUser
}