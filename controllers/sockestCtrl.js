class SocketsCtrl {

    #socketIO;

    constructor(io, sessionController) {
        this.io = io;
        this.sessionController = sessionController;
        this.#socketIO;
    }

    init() {
        this.io.on('connection', (socket) => {
            this.#socketIO = socket;
            this.#registerInitialListeners();
        })
    }

    #registerInitialListeners() {
        this.#socketIO.on("disconnect", () => {
            try {
                const user = this.#socketIO.data.user;
                console.log("Usuario desconectado: ", user);
                if (user) {
                    this.#socketIO.emit("logOutUser", user);
                    this.sessionController.removeUser(user);
                    this.#socketIO.off(`${data.userName}`);
                }
            } catch(err) {
                console.log('error on remove user: ', err);
            }
        });

        this.#socketIO.on('loginUser', (data) => {
            this.#socketIO.data.user = data;
            this.#socketIO.emit("newUserLogin", this.sessionController.recoverUsers());
            this.#socketIO.on(`${data.userName}`, () => console.log('socket login for: ', data))
        });

        this.#socketIO.on('StatusUser', (data) => {
            this.#socketIO.emit("refreshUsers", data);
            this.sessionController.refreshUserPosition(data);
        });

        this.#socketIO.on('publicChat', (data) =>  {
            this.#socketIO.emit('publicChatResponses', data);
        });

        this.#socketIO.on('privateChat', (data) =>  {
            this.#socketIO.emit(data.receiver, data);
        });
    }
}

module.exports = SocketsCtrl;