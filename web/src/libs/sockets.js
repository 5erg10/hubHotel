import { io } from "socket.io-client";
import config from "../config/config";

export class SocketConnection extends EventTarget {

    #connection;

    constructor() {
        super();
    }

    initConnect = async () => {
        this.#connection = io(`${config.socketUrl}`, {transports: ['websocket']});

        this.#connection.on("connect", () => {
            console.log('servidor websockets conectado!!');
        });

        this.#connection.on("userEnter", (data) => {
           this.dispatchEvent(new CustomEvent('userEnter', {detail: data}));
        });

        this.#connection.on('userLeave', (data) => {
            this.dispatchEvent(new CustomEvent('userLeave', {detail: data}));
        })
    }

    Logout = (userData) => {
        this.#connection.emit('userLogOut', { userName: userData.userName, office: userData.office, message: "me piro vampiro!!" });
    }

    loginUser = (userData) => {
        this.#connection.emit('loginUser', userData);
    }

    subscribeToPrivateChannel = () => {
        this.#connection.on('privateChatSender', (data) => {
            this.dispatchEvent(new CustomEvent('privateChatReceive', {detail: data}));
        })
    }

    sendPrivateMessage = ({userSender, userToSend, message}) => {
        this.#connection.emit('privateChatReceiver', {userSender: userSender, userReceiver: userToSend, message});
    }

    updateUserstatus = (user) => {
        this.#connection.emit('userStatus', user);
    }

    receiveUserStatus = () => {
        this.#connection.on('refreshUsers', (users) => {
            this.dispatchEvent(new CustomEvent('refreshUsersPosition', {detail: users}));
        })
    }
}