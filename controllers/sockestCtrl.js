class SocketsCtrl {

    constructor(io, sessionController) {
        this.io = io;
        this.sessionController = sessionController;
    }

    init() {
        this.io.on('connection', (socket) => {
            this.#registerInitialListeners(socket);
        });

        this.#notifyUsersPosition();
        this.sessionController.expireSessions(this.io);
    }

    #registerInitialListeners(socket) {

        socket.on("disconnect", () => {
            try {
                const currentUserData = socket.user;
                if (currentUserData) {
                    this.sessionController.removeUser(currentUserData);
                    const usersList = Object.values(this.sessionController.recoverUsers()).filter(usr => usr.office == currentUserData.office);
                    usersList.forEach(user => {
                        this.io.to(user.userName).emit("userLeave", currentUserData);
                    });
                    socket.leave(`${currentUserData.userName}`);
                }
            } catch(err) {
                console.log('error on remove user: ', err);
            }
        });

        socket.on('loginUser', (data) => {
            if (!data?.userName || typeof data.userName !== 'string' || !data?.office) return;
            socket.user = data;
            socket.join(`${data.userName}`);
            const usersList = Object.values(this.sessionController.recoverUsers()).filter(usr => usr.office == data.office);
            usersList.forEach(user => {
                const usersToNotify = usersList.filter(usr => usr.userName != user.userName);
                if(usersToNotify.length) this.io.to(user.userName).emit("userEnter", usersToNotify);
            });
        });

        socket.on('userStatus', (data) => {
            if (!data?.userName || typeof data.userName !== 'string') return;
            this.sessionController.refreshUserPosition(data);
        });

        socket.on('publicChat', (data) =>  {
            if (!data) return;
            socket.broadcast.emit('publicChatResponses', data);
        });

        socket.on('privateChatReceiver', (data) =>  {
            if (!data?.userReceiver || !data?.userSender || typeof data.userReceiver !== 'string') return;
            this.io.to(data.userReceiver).emit('privateChatSender', data);
        });

        socket.on('privateChatClose', (data) => {
            if (!data?.userReceiver || typeof data.userReceiver !== 'string') return;
            this.io.to(data.userReceiver).emit('privateChatCloseSender', data);
        });
    }

    #notifyUsersPosition() {
        setInterval(() => {
            const usersList = Object.values(this.sessionController.recoverUsers());
            usersList.forEach(user => {
                const usersToNotify = usersList.filter(usr => usr.office == user.office).filter(usr => usr.userName != user.userName).map(usr => ({userName: usr.userName, position: usr.position, rotation: usr.rotation}));
                if(usersToNotify.length) this.io.to(user.userName).emit("refreshUsers", usersToNotify);
            });
        }, 1000 / 30);
    }
}

module.exports = SocketsCtrl;