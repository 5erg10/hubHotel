import { io } from "socket.io-client";

export class SocketConnection {

    static #connection;

    static initConnect = async () => {
        this.#connection = io(`http://localhost:3000`, {transports: ['websocket']});

        this.#connection.on("connect", () => {
            console.log('servidor websockets conectado!!')
        })
    }
}