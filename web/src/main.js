import './styles/style.css';
import { Scene3D } from './libs/3dScene.js';
import { animateLogo, createAnimTimeline } from './libs/animations.js';
import { checkIfUserExists } from './libs/login.js';
import { UserControls } from './libs/UserControls.js';

let inputTimeout, userName, usercontroller;

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

// name input logic controls enabling of continue button and advice message depending on the validity of the input name, also checks if the user exists in the database with a debounce of 500ms to avoid excessive calls to the backend while the user is typing
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

        const userExists = await checkIfUserExists(user);
        
        if (userExists) {
            configAvatar.setAttribute('disabled', 'true');
            userNameAdvice.innerHTML = 'Este nombre ya se esta usando, elige otro'
        } else {
            configAvatar.setAttribute('disabled', '');
            userNameAdvice.innerHTML = ''
        }
    }, 500);
});

// Listen for the custom event dispatched from floors option created in DomManipulate.js
document.addEventListener('floorSelected', async (event) => {

    const { plantName } = event.detail;

    const mainScene = new Scene3D();

    renderContent.appendChild(mainScene.getRenderer().domElement);

    const floorAdded = await mainScene.addFloorToScene(plantName);

    const avatarAdded = await mainScene.addAvatarToScene(AVATARBODYCONFIG.current, AVATARHEADCONFIG.current, userName);

    usercontroller = new UserControls({
        avatar: mainScene.getAvatar(),
        camera: mainScene.getCamera(),
        mixer: mainScene.getAvatarMixerConfig()
    });
    usercontroller.enableControls();

    mainScene.animScene();

    timeline.tweenTo('openApp');

    window.scene = mainScene.getScene();
});

window.animTimeline = (step) => {
    if(step === 'back') {
        timeline.reverse();
        return;
    }

    timeline.tweenTo(step);
}

window.setAvatarConfig = (part, step) => {
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



