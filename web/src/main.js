import { Scene3D } from './libs/3dScene.js';
import { animateLogo, createAnimTimeline } from './libs/animations.js';
import { UserControls } from './libs/UserControls.js';
import { SocketConnection } from './libs/sockets.js';
import { DataSource } from './libs/dataSources.js';
import { DomManiputale } from './libs/DomManipulate.js';

let inputTimeout, userName, usersList, usersConnected = [];
const saveUserDataOnLocalStorage = false;

const timeline = createAnimTimeline();

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

const socketConnet = new SocketConnection();

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
    console.log('clean name: ', cleanName);
    const responseByObject = {
        [!!sections[cleanName]]: () => DomManiputale.addSeccionDetailsToWindow(sections[cleanName]),
        [usersConnected.includes(cleanName)]: () => console.log(`Has colisionado con el usuario ${cleanName}`)
    }[true]?.();
}

const init3DScene = async (floorName) => {

    try {

        const mainScene = new Scene3D();

        if (saveUserDataOnLocalStorage) localStorage.setItem('sceConfig', JSON.stringify({
            userName: userName,
            floor: floorName,
            avatarHead: AVATARHEADCONFIG.current,
            avatarBody: AVATARBODYCONFIG.current
        }));

        renderContent.appendChild(mainScene.getRenderer().domElement);

        await mainScene.addFloorToScene(floorName);

        await mainScene.addAvatarToScene(AVATARBODYCONFIG.current, AVATARHEADCONFIG.current, userName);

        const usercontroller = new UserControls({
            avatar: mainScene.getAvatar(),
            camera: mainScene.getCamera(),
            mixer: mainScene.getAvatarMixerConfig()
        });

        usercontroller.enableControls();
        
        mainScene.setUserControls(usercontroller);

        mainScene.animScene();

        animTimeline('openApp');

        const userDataTosave = {
            office: floorName,
            userName,
            position: {x: 0, y: 0, z: 0},
            rotation: {x: 0, y: 0, z: 0},
            userHead: AVATARHEADCONFIG.current,
            userBody: AVATARBODYCONFIG.current
        };

        await DataSource.saveUser(userDataTosave);

        // notifica el alga de usuario al servidor de sockets
        socketConnet.loginUser(userDataTosave);

        // se subscribe al canal privado de sockets para recibir mensajes de otros usuarios
        socketConnet.subscribeToPrivateChannel();

        // se subscribe al canal que informa de la position del resto de usuarios para que el evento refreshUsersPosition actualice la actualice en el mapa
        socketConnet.receiveUserStatus();

        // notifica cuando un usuario entra en el mapa para añadir su avatar 3D
        socketConnet.addEventListener('userEnter', (event) => {
            const usersToAddOnScene = event.detail.filter(usr => !usersConnected.includes(usr.userName));
            mainScene.addExternalUsersToScene(usersToAddOnScene).then(() => {
                event.detail.forEach( usr => {
                    if (!usersConnected.includes(usr.userName)) usersConnected.push(usr.userName);
                });
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

        mainScene.addEventListener('ObjectColision', (objectName) => {
            collisionReaction(objectName.detail);
        });

        mainScene.addEventListener('noCollisions', () => {
            DomManiputale.removeInfoLabel();
        });

        // actualizo en el servidor la posicion de mi avatar para que se actualice en el mapa de otros usuarios
        setInterval(() => {
            socketConnet.updateUserstatus({userName, office: floorName, position: mainScene.getAvatarPosition(), rotation: mainScene.getAvatarRotation()});
        }, 1000 / 30);

        // window.scene = mainScene.getScene(); // for debug purpose

    } catch(error) {
        console.log('error on load scene: ', error);
        animTimeline('selectOffice');
    }
};

const animTimeline = (step) => {
    if(step === 'back') {
        timeline.reverse();
        return;
    }
    timeline.tweenTo(step);
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
inputNameLabel.addEventListener('keyup', (e) => {
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

Object.assign(document, {
    initApp,
    init3DScene,
    animTimeline,
    setAvatarConfig
});


