import { io } from "socket.io-client";

export class SocketConnection {

    static #connection;

    static initConnect = async () => {
        this.#connection = io(`http://localhost:3000`, {transports: ['websocket']});

        this.#connection.on("connect", () => {
            console.log('servidor websockets conectado!!')
        })
    }

    static Logout = (userData) => {
        this.#connection.emit('userLogOut', { userName: userData.userName, office: userData.office, message: "me piro vampiro!!" });
    }

    static loginUser = (userData) => {
        this.#connection.emit('loginUser', userData);
    }

    static sendPrivateMessage = (userData) => {
        this.#connection.emit(userData.userName, {message: 'private message from ' + userData.userName});
    }
}