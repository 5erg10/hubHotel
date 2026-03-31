import { Scene3D } from './libs/3dScene.js';
import { animateLogo, createAnimTimeline } from './libs/animations.js';
import { UserControls } from './libs/UserControls.js';
import { SocketConnection } from './libs/sockets.js';
import { DataSource } from './libs/dataSources.js';
import { DomManiputale } from './libs/DomManipulate.js';
import { SoundManager } from './libs/audioMixer.js';

let inputTimeout, userName, usersList, usersConnected = [], currentStep = 'splash';
const saveUserDataOnLocalStorage = false;
let enableUsersColision = false, enableUserCollisionsTimer;

const timeline = createAnimTimeline();

const socketConnet = new SocketConnection();

const mainScene = new Scene3D();

const domManipulator = new DomManiputale();

const userController = new UserControls();

const soundManager = new SoundManager();

const userConfig = {
    office: '',
    userName: '',
    position: {x: 0, y: 0, z: 0},
    rotation: {x: 0, y: 0, z: 0},
    userHead: '',
    userBody: ''
}

const AVATARHEADCONFIG = {
    options: ['head_1', 'head_2','head_3', 'head_4', 'head_5', 'head_6'],
    current: 'head_1',
    domElement: selectorHeadBox,
    imagesDirectory: 'images/avatarHeads/'
};

const AVATARBODYCONFIG = {
    options: ['body_1','body_2','body_3','body_4', 'body_5', 'body_6', 'body_7', 'body_8', 'body_9'],
    current: 'body_1',
    domElement: selectorBodyBox,
    imagesDirectory: 'images/avatarBodies/'
};

const sections = {
    comedor: { title: 'Comedor', info: 'Aquì es donde viene la gente cuando quiere comer.'},
    innovacion: { title: 'Innovaciòn', info: 'Aquì es donde se prueban nuevas tecnoologias, por si alguna merece la pena.'},
    recepción: { title: 'Recepciòn', info: 'Si necesitas ayuda con cualquier informaciòn, aquì te atenderàn con sumo gusto.'},
    it: { title: 'IT', info: 'Aquì es donde vienes cuando necesitas permisos para accesos, portatiles nuevos...'},
    biblioteca: { title: 'Biblioteca', info: 'Si tienes que estudiar, ¿què mejor sitio que este?'},
    cocina: { title: 'Cocina', info: '¿No te tragiste comida de casa?, no pasa nada, aquì te ofreceran siempre algo rico.'},
    alacena: { title: 'Alacena', info: 'Si te tragiste comida de casa, aquì estara a buen recaudo hasta la hora de comer.'},
    comunicación: { title: 'Comunicaciòn', info: 'Todo lo que tenga que ver con la comunicaciòn de la empresa con clientes o empleados pasa por aquì.'},
    people: { title: 'People', info: 'El recursos humanos de siempre esta aqui.'},
    finance: { title: 'Finance', info: 'Aquì se suelen poner los jefes (Pasa con cuidado ...).'},
    proyectos: { title: 'Proyectos', info: 'Aquì podràs encontrar a las personas que trabajan en los diferentes proyectos de la empresa.'},
};

animateLogo();

const initApp = async () => {

    inputNameLabel.disabled = true;
    userNameAdvice.innerHTML = 'Cargando lista de usuarios ...';

    const prevUserConfig = localStorage.getItem('sceConfig');
    
    if(prevUserConfig) {
        const userConfigObject = JSON.parse(prevUserConfig);
        AVATARBODYCONFIG.current = userConfigObject.avatarBody;
        AVATARHEADCONFIG.current = userConfigObject.avatarHead;
        userName = userConfigObject.userName;
        init3DScene(userConfigObject.floor);
    } else {
        localStorage.clear();
        animTimeline('configName');
    }

    usersList = await DataSource.getUserList();

    inputNameLabel.disabled = false;
    userNameAdvice.innerHTML = '';

    socketConnet.initConnect();
}

const collisionReaction = (objectName) => {
    const cleanName = objectName.replace(/\d/g, "").toLowerCase();
    if (!!sections[cleanName]) domManipulator.addSeccionDetailsToWindow(sections[cleanName]);
    if(enableUsersColision && usersConnected.includes(cleanName)) {
        if(!!userController) userController.disableControls();
        domManipulator.addPrivateChatWindow(cleanName);
    }
}

const init3DScene = async (floorName) => {

    try {

        if (saveUserDataOnLocalStorage) localStorage.setItem('sceConfig', JSON.stringify({
            userName: userName,
            floor: floorName,
            avatarHead: AVATARHEADCONFIG.current,
            avatarBody: AVATARBODYCONFIG.current
        }));

        Object.assign(userConfig, {
            office: floorName,
            userName,
            userHead: AVATARHEADCONFIG.current,
            userBody: AVATARBODYCONFIG.current
        });

        renderContent.appendChild(mainScene.getRenderer().domElement);

        await mainScene.addFloorToScene(floorName);

        await mainScene.addAvatarToScene(AVATARBODYCONFIG.current, AVATARHEADCONFIG.current, userName);

        userController.initController({
            avatar: mainScene.getAvatar(),
            camera: mainScene.getCamera(),
            mixer: mainScene.getAvatarMixerConfig()
        });

        userController.enableControls();
        
        mainScene.setUserControls(userController);

        mainScene.animScene();

        animTimeline('openApp');

        await DataSource.saveUser(userConfig);

        // notifica el alga de usuario al servidor de sockets
        socketConnet.loginUser(userConfig);

        // se subscribe al canal privado de sockets para recibir mensajes de otros usuarios
        socketConnet.subscribeToPrivateChannel();

        // se subscribe al canal que notifica cuando otro usuario cierra su chat
        socketConnet.subscribeToPrivateChatClose();

        // se subscribe al canal que informa de la position del resto de usuarios para que el evento refreshUsersPosition actualice la actualice en el mapa
        socketConnet.receiveUserStatus();

        addMainListeners();

        enableUserCollisionsTimer = setTimeout(() => { enableUsersColision = true }, 3000);

        // actualizo en el servidor la posicion de mi avatar sincronizado con el loop de render
        mainScene.addEventListener('positionUpdate', () => {
            socketConnet.updateUserstatus({userName, office: floorName, position: mainScene.getAvatarPosition(), rotation: mainScene.getAvatarRotation()});
        });

    } catch(error) {
        console.log('error on load scene: ', error);
        animTimeline('selectOffice');
    }
};

const STEP_ORDER = ['splash', 'configName', 'configAvatar', 'selectOffice'];

const animTimeline = (step) => {
    if (step === 'back') {
        timeline.reverse();
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx > 0) currentStep = STEP_ORDER[idx - 1];
        return;
    }
    timeline.tweenTo(step);
    currentStep = step;
}

const setAvatarConfig = (part, step) => {
    const avatarConfig = {
        head: AVATARHEADCONFIG,
        body: AVATARBODYCONFIG
    }[part];

    const currentAvatarPartIndex = avatarConfig.options.indexOf(avatarConfig.current);

    const partIndex = {
        [currentAvatarPartIndex + (step) > avatarConfig.options.length - 1]: 0,
        [currentAvatarPartIndex + (step) < 0]: avatarConfig.options.length - 1,
        [currentAvatarPartIndex + (step) >= 0 && currentAvatarPartIndex + (step) < avatarConfig.options.length]: currentAvatarPartIndex + (step),
    }

    avatarConfig.current = avatarConfig.options[partIndex['true']];
    avatarConfig.domElement.src = `${avatarConfig.imagesDirectory}${avatarConfig.current}.png`;
};

// ----- LISTENERS ----------------------

const addMainListeners = () => {

    // notifica cuando un usuario entra en el mapa para añadir su avatar 3D
    socketConnet.addEventListener('userEnter', (event) => {
        const usersToAddOnScene = event.detail.filter(usr => !usersConnected.includes(usr.userName));
        mainScene.addExternalUsersToScene(usersToAddOnScene).then(() => {
            event.detail.forEach( usr => {
                if (!usersConnected.includes(usr.userName)) usersConnected.push(usr.userName);
            });
            clearTimeout(enableUserCollisionsTimer);
            enableUserCollisionsTimer = setTimeout(() => { enableUsersColision = true; }, 3000);
        }).catch(() => {
            console.log('error on add new user to scene')
        });
    });

    // Notifica cuando un usuario sale de la aplicacion para eliminar su Avatar del mapa
    socketConnet.addEventListener('userLeave', (event) => {
        mainScene.removeExternalUserFromScene(event.detail.userName);
        usersConnected = usersConnected.filter(usr => usr != event.detail.userName);
    });

    // Recive la posicion de los usuarios para actualizarla en el mapa
    socketConnet.addEventListener('refreshUsersPosition', (users) => {
        mainScene.updateUsersPosition(users.detail);
    });
    
    // Recibe los mensajes que otro usuario el envie por chat privado
    socketConnet.addEventListener('privateChatReceive', (data) => {
        userController.disableControls();
        const cleanName = data.detail.userSender.replace(/\d/g, "").toLowerCase();
        domManipulator.addPrivateChatWindow(cleanName);
        domManipulator.addOtherUserMessageToChat(cleanName, data.detail.message);
        soundManager.playFX();
        document.title = `Nuevo mensaje de ${cleanName}!`;
    });

    // recive los datos de los objetos con los que nuestro avatar colicione en la escena, incluido otros usuarios
    mainScene.addEventListener('ObjectColision', (objectName) => {
        collisionReaction(objectName.detail);
    });

    // Notifica cuando nuestro avatar no esta en colision con ningun elemento del escenario
    mainScene.addEventListener('noCollisions', () => {
        domManipulator.removeInfoLabel();
    });

    // envia un mensaje privado a otro usuario
    domManipulator.addEventListener('sendPrivateChat', (msg) => {
        if (msg.detail?.msg) socketConnet.sendPrivateMessage({userSender: userConfig.userName, userToSend: msg.detail.chatUserName, message: msg.detail.msg});
    });

    // cierra un mensaje privado con otro usuario (accion local)
    domManipulator.addEventListener('privateChatClosed', (e) => {
        socketConnet.sendPrivateChatClose({userSender: userConfig.userName, userToSend: e.detail});
        if (!document.getElementById('privateChatMainContainer')) userController.enableControls();
    });

    // otro usuario ha cerrado su chat con nosotros
    socketConnet.addEventListener('privateChatCloseReceive', (e) => {
        const cleanName = e.detail.userSender.replace(/\d/g, "").toLowerCase();
        domManipulator.removePrivateChatWindow(cleanName);
        if (!document.getElementById('privateChatMainContainer')) userController.enableControls();
    });
}

inputNameLabel.addEventListener('keyup', (e) => {
    if(e.key == "Enter" && !configAvatar.getAttribute('disabled') && currentStep === 'configName') {
        animTimeline('configAvatar');
        return;
    }
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(async () => {

        const user = e.target.value.trim().toLowerCase();

        if (!user) {
            configAvatar.setAttribute('disabled', 'true');
            userNameAdvice.innerHTML = 'Debes introducir un nombre de usuario';
            return;
        }

        userName = user;
        
        if (usersList.includes(userName)) {
            configAvatar.setAttribute('disabled', 'true');
            userNameAdvice.innerHTML = 'Este nombre ya se esta usando, elige otro'
        } else {
            configAvatar.setAttribute('disabled', '');
            userNameAdvice.innerHTML = ''
        }
    }, 500);
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (currentStep === 'splash') { currentStep = 'loading'; initApp(); }
    else if (currentStep === 'configAvatar') animTimeline('selectOffice');
    else if (currentStep === 'selectOffice') init3DScene('manoteras');
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        document.title = 'Hub-Hotel';
    }
});

Object.assign(document, {
    initApp,
    init3DScene,
    animTimeline,
    setAvatarConfig
});


