import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const HOLLOW_OBJECTS = ['interactparedes', 'interactcristaleras'];
export class Scene3D {

    #floor;
    #avatar;
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

    constructor() {

        this.#interactiveObjects = [];

        this.#playerBox = new THREE.Box3();
        this.#userName;

        this.clock = new THREE.Timer();

        this.#floor = new THREE.Object3D();
        this.#floor.name = "floorGroup";

        this.#avatar = new THREE.Object3D();
        this.#avatar.name = "avatarGroup";

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
    };

    getRenderer() { return this.#renderer; };
    getScene()    { return this.#scene; };
    getCamera()   { return this.#camera; }
    getFloor()    { return this.#floor; };
    getAvatar()   { return this.#avatar; };
    getAvatarMixerConfig() { return this.#avatarAnimConfig; };
    
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

                const collisionCubeGeometry = new THREE.BoxGeometry(0.04, 0.06, 0.07);
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

        const collisionCube = this.#avatar.children.find(child => child.name === this.#userName);
        if (!collisionCube || this.#interactiveObjects.length === 0) return;

        this.#playerBox.setFromObject(collisionCube);

        collisionCube.updateWorldMatrix(true, false);
        const avatarPos = new THREE.Vector3();
        collisionCube.getWorldPosition(avatarPos);

        for (const obj of this.#interactiveObjects) {
            if (this.#playerBox.intersectsBox(obj.userData.collisionBox)) {
                console.log('collision object: ', obj.name);
                collisionDetected = true;
                break;
            }
        }
        this.#userControls[collisionDetected ? 'blockDirection' : 'unblockDirection']();
    };
}
