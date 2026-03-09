import { Scene3D } from './libs/3dScene.js';
import { animateLogo, createAnimTimeline } from './libs/animations.js';
import { UserControls } from './libs/UserControls.js';
import { SocketConnection } from './libs/sockets.js';
import { DataSource } from './libs/dataSources.js';

let inputTimeout, userName, office, usersList;
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

animateLogo();

SocketConnection.initConnect();

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

}

const init3DScene = async (floorName) => {

    try {

        office = floorName;

        const mainScene = new Scene3D();

        if (saveUserDataOnLocalStorage) localStorage.setItem('sceConfig', JSON.stringify({
            userName: userName,
            floor: floorName,
            avatarHead: AVATARHEADCONFIG.current,
            avatarBody: AVATARBODYCONFIG.current
        }));

        renderContent.appendChild(mainScene.getRenderer().domElement);

        const floorAdded = await mainScene.addFloorToScene(floorName);

        const avatarAdded = await mainScene.addAvatarToScene(AVATARBODYCONFIG.current, AVATARHEADCONFIG.current, userName);

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

        SocketConnection.loginUser(userDataTosave);

        document.scene = mainScene.getScene();

        setTimeout(() => {
            console.log('sending first message')
            SocketConnection.sendPrivateMessage(userDataTosave);
        }, 10000);

    } catch(error) {
        console.log('error on load scene!!');
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


