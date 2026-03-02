export const getUserList = () => {
    return new Promise((resolve, reject) => {
        fetch('http://localhost:3000/user/list').then(response => 
            response.json().then(data => {
                console.log('data: ',data);
                resolve(data);
            })
        );
    });
}