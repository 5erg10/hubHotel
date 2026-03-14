import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const HOLLOW_OBJECTS = ['interactparedes', 'interactcristaleras'];

/**
 * Creates a billboard Sprite with the given username rendered as a texture.
 * The sprite always faces the camera automatically (Three.js Sprite behaviour).
 *
 * @param {string} userName
 * @returns {THREE.Sprite}
 */
function createUserNameSprite(userName) {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    const fontSize   = 48;
    const padding    = 16;
    const fontFamily = 'Arial, sans-serif';

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(userName).width;

    canvas.width  = textWidth + padding * 2;
    canvas.height = fontSize  + padding * 2;

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    const radius = canvas.height / 2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
    ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
    ctx.arcTo(0, canvas.height, 0, 0, radius);
    ctx.arcTo(0, 0, canvas.width, 0, radius);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.font         = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle    = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText(userName, canvas.width / 2, canvas.height / 2);

    const texture  = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite   = new THREE.Sprite(material);

    // Scale sprite so it looks right relative to the avatar size
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(aspect * 0.12, 0.12, 1);

    // Position it above the avatar's head
    sprite.position.set(0, 0.42, 0);
    sprite.name = 'userName-label';

    return sprite;
}

export class Scene3D extends EventTarget {

    #floor;
    #avatar;
    #users;
    #renderer;
    #scene;
    #with;
    #height;
    #avatarAnimConfig;
    #camera;
    #interactiveObjects;
    #userName;
    #playerBox;
    #userControls = null;
    #collisionObjectName;

    constructor() {

        super();

        this.#interactiveObjects = [];

        this.#playerBox = new THREE.Box3();
        this.#userName;

        this.clock = new THREE.Timer();

        this.#floor = new THREE.Object3D();
        this.#floor.name = "floorGroup";

        this.#avatar = new THREE.Object3D();
        this.#avatar.name = "avatarGroup";

        this.#users = new THREE.Object3D();
        this.#users.name = "usersAvatarGroup";

        this.#avatarAnimConfig = {
            body: { mixer: null, animations: null },
            head: { mixer: null, animations: null }
        };

        this.#with = window.innerWidth;
        this.#height = window.innerHeight;

        this.#camera = new THREE.PerspectiveCamera(60, (this.#with / this.#height), 0.01, 10000000);
        this.#camera.name = "mainCamera";
        this.#camera.position.set(1, 2, 0);

        this.#scene = new THREE.Scene();
        this.ambientLight = new THREE.AmbientLight(0xffffff, 7);
        this.ambientLight.name = "mainLight";
        this.#scene.add(this.ambientLight);

        this.#renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.#renderer.domElement.id = 'svgObject';
        this.#renderer.sortObjects = false;
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize( this.#with, this.#height );
        this.#renderer.setClearColor(0x2776b3, 1);
        this.#renderer.setViewport(0, 0, this.#with, this.#height);
        this.#renderer.gammaOutput = true;

        this.#collisionObjectName = undefined;
    };

    getRenderer() { return this.#renderer; };
    getScene()    { return this.#scene; };
    getCamera()   { return this.#camera; }
    getFloor()    { return this.#floor; };
    getAvatar()   { return this.#avatar; };
    getAvatarMixerConfig() { return this.#avatarAnimConfig; };
    getAvatarPosition() { return this.#avatar.position };
    getAvatarRotation() { return this.#avatar.rotation };
    
    setUserControls(userControls) {
        this.#userControls = userControls;
    };

    addFloorToScene(officeName) {
        return new Promise((resolve) => {

            const mtlLoader = new MTLLoader();
            mtlLoader.setPath('/models/');
            mtlLoader.setMaterialOptions( { side: THREE.DoubleSide } );

            mtlLoader.load(officeName+'.mtl', (materials) => {
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath('/models/');

                objLoader.load(officeName+'.obj', (officeObjects) => {
                    officeObjects.children.map((plantObject) => {
                        plantObject.name = plantObject.name.replace(/_[a-z]*.[0-9]*/gi, "");
                        
                        if (plantObject.name.match("interact")) {
                            const normalizedName = plantObject.name.toLowerCase();
                            const isHollow = HOLLOW_OBJECTS.some(h => normalizedName.includes(h));

                            if (isHollow) plantObject.material.side = THREE.DoubleSide;

                            plantObject.userData.collisionBox = new THREE.Box3().setFromObject(plantObject);

                            this.#interactiveObjects.push(plantObject);
                        }

                        plantObject.name = plantObject.name.replace('interact', '');

                        if (Array.isArray(plantObject.material)) {
                            plantObject.material.map((mat) => {
                                if (mat.name.substring(0,11) == 'transparent') mat.transparent = true;
                            });
                        } else if (plantObject.material.name.substring(0,11) == 'transparent') {
                            plantObject.material.transparent = true;
                        }
                    });

                    officeObjects.name = officeName;
                    this.#floor.add(officeObjects);
                    this.#scene.add(this.#floor);
                    console.log(`#floor ${officeName} added to #scene!!`);
                    return resolve(this.#floor);

                }, (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = xhr.loaded / xhr.total * 100;
                        console.log(`#floor ${officeName} ${(Math.round(percentComplete * 100) / 100)}% loaded`);
                    }
                }, (error) => {
                    console.error(`Error loading #floor ${officeName}:`, error);
                });
            });
        });
    };

    addExternalUsersToScene(users) {

        return new Promise((resolve, reject) => {

            const loadPromise = (path) => {
                return new Promise((resolve, reject) => new GLTFLoader().load(path, (gltf) => resolve(gltf), undefined, (error) => reject(error)));
            };

            for( const user of users) {
                Promise.all([
                    loadPromise(`/models/avatars/bodies/${user.userBody}.glb`),
                    loadPromise(`/models/avatars/heads/${user.userHead}.glb`)
                ]).then(([bodyGltf, headGltf]) => {

                    const userGroup = new THREE.Object3D();
                    userGroup.name = user.userName;
                    userGroup.position.set(user.position.x, user.position.y, user.position.z);

                    const headModel = headGltf.scene;
                    headModel.name = 'head';
                    const bodymodel = bodyGltf.scene;
                    bodymodel.name = 'body';

                    const collisionCubeGeometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
                    const collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
                    const collisionCubefront = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
                    collisionCubefront.name = user.userName;
                    collisionCubefront.visible = false;
                    collisionCubefront.position.set(0, 0.1, 0);

                    // Username label — billboard sprite that always faces the camera
                    const nameSprite = createUserNameSprite(user.userName);

                    userGroup.add(bodymodel, headModel, collisionCubefront, nameSprite);

                    collisionCubefront.userData.collisionBox = new THREE.Box3().setFromObject(collisionCubefront);

                    this.#users.add(userGroup);

                    this.#interactiveObjects.push(collisionCubefront);

                    console.log(`user ${user.userName} added to #scene!!`);

                }).catch((error) => {
                    console.error(`Error loading #users:`, error);
                    return reject();
                });
            }
            
            this.#scene.add(this.#users);

            return resolve();

        })
    }

    removeExternalUserFromScene(userName) {
        this.#users.children = this.#users.children.filter(usr => usr.name != userName);
        this.#interactiveObjects = this.#interactiveObjects.filter(usr => usr.name != userName);
    }

    updateUsersPosition(users) {
        users.forEach(usr => {
            const userPosition = usr.position;
            const userRotation = usr.rotation;
            const userObject = this.#users.children.find( child => child.name == usr.userName )
            userObject?.position.set(userPosition.x, userPosition.y, userPosition.z);
            userObject?.rotation.copy(new THREE.Euler(userRotation._x, userRotation._y, userRotation._z, userRotation._order));
        })
    }

    addAvatarToScene(bodyName, headName, userName) {

        this.#userName = userName;

        const loadPromise = (path) => {
            return new Promise((resolve, reject) => new GLTFLoader().load(path, (gltf) => resolve(gltf), undefined, (error) => reject(error)));
        };

        return new Promise((resolve) => {
            this.#scene.remove(this.#avatar);
            this.#avatar = new THREE.Object3D();
            this.#avatar.name = "avatarGroup";

            Promise.all([
                loadPromise(`/models/avatars/bodies/${bodyName}.glb`),
                loadPromise(`/models/avatars/heads/${headName}.glb`)
            ]).then(([bodyGltf, headGltf]) => {
                const headModel = headGltf.scene;
                headModel.name = 'head';
                const bodymodel = bodyGltf.scene;
                bodymodel.name = 'body';

                Object.assign(this.#avatarAnimConfig, {
                    head: { mixer: new THREE.AnimationMixer(headModel), animations: headGltf.animations },
                    body: { mixer: new THREE.AnimationMixer(bodymodel), animations: bodyGltf.animations }
                });

                const collisionCubeGeometry = new THREE.BoxGeometry(0.04, 0.15, 0.07); // width, height, depth
                const collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
                const collisionCubefront = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
                collisionCubefront.name = userName;
                collisionCubefront.visible = false;
                collisionCubefront.position.set(0, 0.1, 0.05);

                this.#avatar.add(bodymodel, headModel, collisionCubefront);
                this.#scene.add(this.#avatar);

                console.log(`Avatar body ${bodyName} added to #scene!!`);
                return resolve(this.#avatar);

            }).catch((error) => {
                console.error(`Error loading #avatar:`, error);
                return resolve(false);
            });
        });
    };

    animScene() {

        this.#renderer.setAnimationLoop((time) => {

            this.clock.update();
            const delta = this.clock.getDelta();

            if (this.#avatarAnimConfig.body.mixer && this.#avatarAnimConfig.head.mixer) {
                this.#avatarAnimConfig.body.mixer.update(delta);
                this.#avatarAnimConfig.head.mixer.update(delta);
            }

            this.#checkAvatarCollision();

            this.#camera.lookAt(this.#avatar.position);
            this.#renderer.render(this.#scene, this.#camera);
        });
    };

    #checkAvatarCollision = () => {
        
        if (!this.#userControls) return;

        let collisionDetected = false;
        let collisionObjectName = '';

        const collisionCube = this.#avatar.children.find(child => child.name === this.#userName);
        if (!collisionCube || this.#interactiveObjects.length === 0) return;

        this.#playerBox.setFromObject(collisionCube);

        collisionCube.updateWorldMatrix(true, false);
        const avatarPos = new THREE.Vector3();
        collisionCube.getWorldPosition(avatarPos);

        for (const obj of this.#interactiveObjects) {
            if (this.#playerBox.intersectsBox(obj.userData.collisionBox)) {
                collisionObjectName = obj.name;
                collisionDetected = true;
                break;
            }
        }

        if (collisionDetected) {
            this.#userControls['blockDirection']();
            if(this.#collisionObjectName != collisionObjectName) {
                this.#collisionObjectName = collisionObjectName;
                this.dispatchEvent(new CustomEvent('ObjectColision', {detail: collisionObjectName}));
            }
        } else {
            this.#userControls['unblockDirection']();
            if(this.#collisionObjectName) this.dispatchEvent(new CustomEvent('noCollisions'));
            this.#collisionObjectName = undefined;
        }
    };
}
