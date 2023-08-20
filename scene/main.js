window.addEventListener('resize', onWindowResize, false);
//Debugg options
//Select true for skip config menu and seek to scene directly
let debbugerSkipOption = false;
//select type of controls = "camera" for free camera control or "avatar" for avatar keys control
const typeOfControls = "avatar";// options: ["avatar", "camera"]

let camera, scene, renderer, controls, avatarControls, collisionCube, previousCollision, collisionPosition, animLoader,
headanimLoader, mixer, headmixer, bodyModel, headModel, avatarAnimations, avatarHeadAnimation, socket, privateChatReceiverUser,
width = window.innerWidth, height = window.innerHeight;

let externaUsersList = {};    

let clock = new THREE.Clock();

let manager = new THREE.LoadingManager();

let planta = new THREE.Object3D();
planta.name = 'planta';

let avatar = new THREE.Object3D();
avatar.name = 'avatar';

let interactiveObjects = [];

const plantas = ['tablas2-P2', 'tablas2-P1', 'tablas2-P0', 'manoteras'];
const modelos_head = ['head_1', 'head_2','head_3', 'head_4', 'head_5', 'head_6'];
const modelos_body = ['body_1','body_2','body_3','body_4', 'body_5', 'body_6', 'body_7', 'body_8', 'body_9'];

let initialBody = initialHead = 0;

let avatarConfig = { head: 'head_1', body: 'body_1' };

let saveData = {};

let turnOnCollision = false;

let jumping = false;

$(document).ready(function () {
    generateMenu();
    initRender();
    animate();
    if(localStorage.getItem('configDataObject') !== null && debbugerSkipOption == true){
        skipMenus(JSON.parse( localStorage.getItem('configDataObject')));
    }
    if( debbugerSkipOption == false ) localStorage.removeItem('configDataObject');

    socket = io.connect(`https://hubhotelserver-94gt-dev.fl0.io:443/`, {transports: ['websocket']});

    socket.on('newUserLogin', function(data){
        console.log(data);
        Object.values(data).map( element => {
            if(!externaUsersList[element.userName] && element.office == saveData.office && saveData.userName !== element.userName){
                Object.assign(externaUsersList, { [element.userName]: element });
                loadAvatarExternal(element);
            }
        })
    });
    socket.on('refreshUsers', function (data) {
        if (scene.getObjectByName( data.userName ) && saveData.userName !== data.userName) {
            scene.getObjectByName( data.userName ).position.set(data.position.x, data.position.y, data.position.z);
            scene.getObjectByName( data.userName ).rotation.y = data.rotation;
        }
    });
    socket.on('logOutUser', function (data) {
        scene.remove(scene.getObjectByName(data.userName));
        interactiveObjects = interactiveObjects.filter(item => item.name !== data.userName);
        delete externaUsersList[data.userName];
    
    });
    socket.on('publicChatResponses', function(data) {
        const user = externaUsersList[data.sender];
        if (user) {
            const msg = data.message
            const label = chatLabel(msg);
            user.avatarModel.remove(user.avatarModel.children.find(item => item.chat));
            user.avatarModel.add(label);
            setTimeout(()=> user.avatarModel.remove(label), 20000);
        }
    });
});

$(window).on("beforeunload", function() { 
    socket.emit('sendLogOutUser', { userName: saveData.userName, office: saveData.office, message: "me piro vampiro!!" });
})

function subscribeToPersonalChannel(userName) {
    socket.on(userName, function (data) {
        const messageListWindow =  document.getElementById("changeMessageListBox");
        //save position of other user to hide chat windows if you left of conversation
        collisionPosition = scene.getObjectByName( data.sender ).position;
        //save user sender name to indentify private conversation on sendMessage() method
        privateChatReceiverUser = data.sender;
        if( document.getElementById("privateChatWindow").offsetTop < 0 ) openPrivateChat();
        fillWithNewMessage(data.sender, data.message, false);
        messageListWindow.scrollTop = messageListWindow.scrollHeight - messageListWindow.clientHeight;
        new Audio('../audio/stairs.mp3').play();
    });
};

function generateMenu(){
    plantas.map(function(plantName){
        $(".officeSelectorMenu").prepend('<div class="plantSelectButton '+plantName+"Style"+'" onclick=loadOffice("'+plantName+'")><P>'+plantName+'</p></div>');
    });
}

function setHead(value){
    initialHead += value;
    if(initialHead < 0) initialHead = modelos_head.length -1;
    if(initialHead > modelos_head.length -1) initialHead = 0;
    if( typeof modelos_head[initialHead] !== 'undefined'  ) {
        document.getElementById("selectorHeadBox").src = 'images/avatarHeads/'+ modelos_head[initialHead] +'.png';
        avatarConfig.head = modelos_head[initialHead];
    }
}

function setBody(value){
    initialBody += value;
    if(initialBody < 0) initialBody = modelos_body.length -1;
    if(initialBody > modelos_body.length -1) initialBody = 0;
    if( typeof modelos_body[initialBody] !== 'undefined'  ) {
        document.getElementById("selectorBodyBox").src = 'images/avatarBodies/'+ modelos_body[initialBody] +'.png';
        avatarConfig.body = modelos_body[initialBody];
    }
}

function initRender() {

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true});
    renderer.sortObjects = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff, 0);
    renderer.setViewport(0, 0, width, height);
    renderer.gammaOutput = true;
    renderer.getMaxAnisotropy();

    element = renderer.domElement;

    let container = document.getElementById('container');
    container.appendChild(element);
    element.id = "svgObject";

    camera = new THREE.PerspectiveCamera(60, (width / height), 0.01, 10000000);
    camera.name = "mainCamera";
    camera.position.set(1, 2, 0);

    scene.add(camera);

    switch(typeOfControls){
        case "camera":
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.70;
            controls.enableZoom = true;
            controls.enableRotate = true;
            controls.enablePan = true;
            controls.target.set(0,0,0);
        break;
        case "avatar":
            avatarControls = new keyControls(avatar);
            camera.lookAt(avatar.position);
        break;    
    };

    ambientLight = new THREE.AmbientLight(0xffffff, 1);
    ambientLight.position.set(0, 0.6, 0);
    ambientLight.name = "mainLight";
    scene.add(ambientLight);

    let directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set(3,3,3);
    directionalLight.name = "secondaryLight";
    scene.add( directionalLight );
}

function loadAvatar() {

    //remove previous avatar elements created
    scene.remove(avatar);
    for (var i = avatar.children.length - 1; i >= 0; i--) {
        avatar.remove(avatar.children[i]);
    }

    //Promise to control de % of objects loading
    let onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            let percentComplete = xhr.loaded / xhr.total * 100;
            console.log(percentComplete);
            if (percentComplete == 100) {
                console.log('Avatar model loaded!!');
            }
        }
    };
    let onError = function (xhr) {
    };

    animLoader = new THREE.GLTFLoader();
    animLoader.load( 'models/avatars/bodies/' + avatarConfig.body + '.glb', function ( gltf ) {
        bodyModel = gltf.scene;
        avatarAnimations = gltf.animations;
        bodyModel.name = 'body';
        avatar.add( bodyModel );
        mixer = new THREE.AnimationMixer( bodyModel );
    }, onProgress, onError);

    headanimLoader = new THREE.GLTFLoader();
    headanimLoader.load( 'models/avatars/heads/' + avatarConfig.head + '.glb', function ( gltf ) {
        headModel = gltf.scene;
        avatarHeadAnimation = gltf.animations;
        headModel.name = 'head';
        avatar.add( headModel );
        headmixer = new THREE.AnimationMixer( headModel );
    }, onProgress, onError);

    //adding cube inside avatar model to check collisions
    let collisionCubeGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    let collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
    collisionCube = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
    collisionCube.name = saveData.userName;
    collisionCube.visible = false;
    collisionCube.position.y = 0.06;
    avatar.add(collisionCube);
    avatar.name = saveData.userName;
    turnOnCollision = true;
    avatar.position.set(0, 0, 0);
    scene.add(avatar);
    avatarControls.checkCollision = () => checkCollision(collisionCube);
    //send data to inscribe user in system and print in other client
    const userDataToLogin = Object.assign(saveData, { position: avatar.position, rotation: avatar.rotation.y, status: avatarControls.action });
    socket.emit('loginUser', userDataToLogin);
    //Send data to socketIO server for refresh user status in other clients
    setInterval(() => {
        const userDataToSend = Object.assign(saveData, { position: avatar.position, rotation: avatar.rotation.y, status: avatarControls.action });
        socket.emit('StatusUser', userDataToSend);
    }, 80);
}

function loadAvatarExternal(externalAvatar) {
    const newUserObject = externaUsersList[externalAvatar.userName];
    newUserObject.avatarModel = new THREE.Object3D();
    newUserObject.avatarModel.position = externalAvatar.position;
    newUserObject.animLoader = new THREE.GLTFLoader();
    newUserObject.animLoader.load( 'models/avatars/bodies/' + externalAvatar.body + '.glb', function ( gltf ) {
        let bodyModel = gltf.scene;
        newUserObject.avatarAnimations = gltf.animations;
        bodyModel.name = 'Body';
        newUserObject.avatarModel.add( bodyModel );
        newUserObject.mixer = new THREE.AnimationMixer( bodyModel );
    });

    newUserObject.headanimLoader = new THREE.GLTFLoader();
    newUserObject.headanimLoader.load( 'models/avatars/heads/' + externalAvatar.head + '.glb', function ( gltf ) {
        let headModel = gltf.scene;
        newUserObject.avatarHeadAnimation = gltf.animations;
        headModel.name = 'Head';
        newUserObject.avatarModel.add( headModel );
        newUserObject.headmixer = new THREE.AnimationMixer( headModel );
    });

    //adding cube inside avatar model to check collisions
    let collisionCubeGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    let collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
    collisionCubeMaterial.transparent = true;
    collisionCubeMaterial.opacity = 0;
    newUserObject.collisionCube = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
    newUserObject.collisionCube.name = externalAvatar.userName;
    newUserObject.collisionCube.objectType = 'otherUser';
    newUserObject.collisionCube.position.y = 0.06;
    newUserObject.avatarModel.add(newUserObject.collisionCube);
    newUserObject.avatarModel.name = externalAvatar.userName;
    newUserObject.avatarModel.add(initLabels(externalAvatar.userName));
    interactiveObjects.push(newUserObject.collisionCube);
    scene.add(newUserObject.avatarModel);
}

function christmastTime() {
    treemodel = new THREE.GLTFLoader();
    treemodel.load( 'models/navidad/navidadTree.glb', function ( gltf ) {
        let treeModel = gltf.scene;
        treeModel.name = 'christmasTree';
        scene.add( treeModel );
    });
}

function loadOffice(officeName) {
    interactiveObjects = [];
    tl.tweenTo("openApp");
    $('#container').removeClass('displayOn');
    scene.remove(planta);
    planta.remove(planta.children[0]);
    let onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            let percentComplete = xhr.loaded / xhr.total * 100;
            if (percentComplete == 100) {}
        }
    };
    let onError = function (xhr) {
    };

    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('models/');
    mtlLoader.setMaterialOptions ( { side: THREE.DoubleSide } );
    mtlLoader.load(officeName+'.mtl', function (materials) {
        materials.preload();
        let objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('models/');
        objLoader.load(officeName+'.obj', function (elements) {
            elements.children.map(function(plantObject) {
                plantObject.name = plantObject.name.replace(/_[a-z]*.[0-9]*/gi, "");
                if( plantObject.name.match("interact")){
                    interactiveObjects.push(plantObject);
                }
                plantObject.name = plantObject.name.replace('interact','');
                if(Array.isArray(plantObject.material)){
                    plantObject.material.map(function(mat){
                        if(mat.name.substring(0,11) == 'transparent') mat.transparent = true;
                    });
                }
                else if(plantObject.material.name.substring(0,11) == 'transparent') plantObject.material.transparent = true;
                
            });
            elements.name = officeName;
            planta.add(elements);
            $('#container').addClass('displayOn');
            loadAvatar();
        }, onProgress, onError);
    });
    scene.add(planta);

    let userNameInput = (document.getElementById("inputNameLabel").value).replace(/\s/g, "_");
    
    //send data to database
    let myHeaders = new Headers()
    myHeaders.append('content-type', 'application/json')
 
    const bodyToSend = { 
        userName: userNameInput,
        userHead: avatarConfig.head,
        userBody: avatarConfig.body,
        office: officeName
    };

    fetch('/newUser', { 
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(bodyToSend),  
    });

    Object.assign(saveData, avatarConfig, { office: officeName }, { userName: userNameInput });
    subscribeToPersonalChannel(saveData.userName);
    if(debbugerSkipOption == true) {
        localStorage.setItem('configDataObject', JSON.stringify(saveData));
    }
}

function skipMenus(savedDatas){
    Object.assign(avatarConfig, {head: savedDatas["head"], body: savedDatas["body"]});
    tl.seek( '-=0', false );
    loadOffice(savedDatas.office); 
}

function checkCollision(cube) {
    var wpVector = new THREE.Vector3();
    var originPoint = cube.getWorldPosition(wpVector).clone();
    var nearCol;
    for (var vertexIndex = 0; vertexIndex < cube.geometry.vertices.length; vertexIndex++) {
        var localVertex = cube.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(cube.matrix);
        var directionVector = globalVertex.sub(cube.position);
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(interactiveObjects);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            nearCol = collisionResults.reduce((max = {}, item) => { item.distance <= max.distance ? max : item; });
            if(nearCol) {
                if(nearCol.object.objectType !== 'otherUser') avatarControls.blockIfCollision();
                if( previousCollision == nearCol.object.name ){
                    debug(nearCol, originPoint);
                    return nearCol;
                }
                else {
                    previousCollision = nearCol.object.name;
                    collisionPosition = originPoint;
                    if(nearCol.object.objectType === 'otherUser') {
                        privateChatReceiverUser = nearCol.object.name;
                        openPrivateChat();
                    }
                    else doSomething(nearCol.object.name);
                    debug(nearCol, originPoint);
                    return nearCol;
                }
            }
        }
        else if (collisionPosition) {
            let distandeBetween = collisionPosition.distanceTo( avatar.position );
            if(distandeBetween > 0.2) {
                removeCollision();
                collisionPosition = undefined;
                privateChatReceiverUser = undefined;
                setTimeout(() => previousCollision = undefined, 1000);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {

    var dt = clock.getDelta();
    if ( mixer ) mixer.update( dt );
    if ( headmixer ) headmixer.update( dt );

    camera.updateMatrixWorld();

    if (controls) {
        controls.update(clock.getDelta());
    }
    if ( avatarControls != undefined ) {
        if(mixer){
            let readedAction = avatarControls.action != undefined ? avatarControls.action : "stand";   

            let bodyAnimation = avatarAnimations[ avatarAnimations.findIndex(x => x.name === readedAction) ];
            let headAnimation = avatarHeadAnimation[ avatarHeadAnimation.findIndex(x => x.name === readedAction) ];
            let bodyClip = mixer.clipAction( bodyAnimation );
            let headClip = headmixer.clipAction( headAnimation );

            switch(readedAction) {
                case 'jump': 
                    mixer.addEventListener( 'loop', function( e ) {
                        var curAction = e.action;
                        curAction.stop();
                    } );
                    headmixer.addEventListener( 'loop', function( e ) {
                        var curAction = e.action;
                        curAction.stop();
                    } );

                    bodyClip.setEffectiveTimeScale(3);
                    bodyClip.play();
                    headClip.setEffectiveTimeScale(3);
                    headClip.play();                    
                break;
                case 'walk':
                        if(avatarControls.direction.x != 0 || avatarControls.direction.z != 0) {
                            bodyClip.play();
                            headClip.play();
                        } else {
                            bodyClip.stop();
                            headClip.stop();
                        }
        
                        camera.lookAt(avatar.position);
                        avatar.position.z += avatarControls.direction.z;
                        avatar.position.x -= avatarControls.direction.x;
                        camera.position.x = avatar.position.x + 0.5;
                        camera.position.z = avatar.position.z;
                break;
            }
        }            
    }
    render();
    TWEEN.update();

    setTimeout(function() {
        requestAnimationFrame(animate);
    }, 1000 / 30);
}

function render() {
    renderer.render(scene, camera);
    if(turnOnCollision) checkCollision(collisionCube);
}

function initLabelMaterial( text, background = true ) {
    var canvas = document.createElement( 'canvas' );
    var ctx = canvas.getContext( '2d' );
    text+=' '
    ctx.fillStyle = background ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0)";
    ctx.fillRect( 0, 0, 25*text.length, 60 );
    ctx.fillStyle = background ? 'white' : 'rgb(214, 161, 60)' ;
    ctx.font = `15pt bbvaweb`;
    ctx.textAlign = 'middle';
    ctx.textBaseline = 'middle';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4;
    ctx.fillText( text, 20, 30 );
    var map = new THREE.CanvasTexture( canvas );
    return new THREE.SpriteMaterial( { map } );
}
  
function initLabels(name, background = true) {
    spriteLabel = new THREE.Sprite( initLabelMaterial( name, background ) );
    spriteLabel.position.set( 0, 0.3, 0 );
    spriteLabel.scale.set( 0.3, 0.15, 1 );
    spriteLabel.center.x = (0.042*name.length).toFixed(2);
    return spriteLabel;
}

function chatLabel(msg) {
    const label = initLabels(msg, false);
    label.position.set( 0, 0.44, 0 );
    label.chat = true;
    return label;
}
 
function movement(value, object, delay, duration, easingType) {
    new TWEEN.Tween(object)
        .to(value, duration)
        .easing(easingType)
        .onUpdate(function () {
        })
        .delay(delay)
        .start();
}
