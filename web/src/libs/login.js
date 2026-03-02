import { getUserList } from './dataSources.js';

export const checkIfUserExists = (user) => {
    return new Promise(async (resolve, reject) => {
        const userList = await getUserList();
        return resolve(userList.includes(user.trim().toLowerCase()));
    });
};