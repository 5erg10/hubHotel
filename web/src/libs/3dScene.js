import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Scene3D {

    // private params
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
    #tempBox;

    // Collision raycasters reused every frame to avoid GC pressure.
    // 8 horizontal directions × 3 heights = 24 raycasters total.
    // Multiple scan heights are needed because objects like tables have
    // geometry only at specific Y levels (legs at ~0.06, tabletop at ~0.75).
    // Walls/panels are tall so a single height sufficed for them, but
    // compact furniture requires scanning at several heights to guarantee a hit.
    #collisionRaycasters;

    // Max distance (world units) at which a ray hit registers as a collision.
    // Slightly larger than half the collisionCube side (0.06/2 = 0.03).
    #collisionThreshold = 0.05;

    // Y offsets (relative to avatar root) at which horizontal rays are cast.
    // Low  = patas de mesas/sillas (~suelo)
    // Mid  = zona media del cuerpo del avatar
    // High = encimeras / tableros de mesa
    #scanHeights = [0.06, 0.5, 0.9];

    constructor() {
        // Set up global variables
        this.#interactiveObjects = [];
        this.#playerBox = new THREE.Box3();
        this.#tempBox = new THREE.Box3();

        this.#userName;

        this.clock = new THREE.Timer();

        this.#floor = new THREE.Object3D();
        this.#floor.name = "floorGroup";

        this.#avatar = new THREE.Object3D();
        this.#avatar.name = "avatarGroup";

        this.#avatarAnimConfig = {
            body: {
                mixer: null,
                animations: null
            },
            head: {
                mixer: null,
                animations: null
            }
        };

        // 8 horizontal directions × 3 scan heights = 24 raycasters
        const rayDirections = [
            new THREE.Vector3( 1,  0,  0),               // E
            new THREE.Vector3(-1,  0,  0),               // W
            new THREE.Vector3( 0,  0,  1),               // S
            new THREE.Vector3( 0,  0, -1),               // N
            new THREE.Vector3( 1,  0,  1).normalize(),   // SE
            new THREE.Vector3(-1,  0,  1).normalize(),   // SW
            new THREE.Vector3( 1,  0, -1).normalize(),   // NE
            new THREE.Vector3(-1,  0, -1).normalize(),   // NW
        ];

        this.#collisionRaycasters = [];

        for (const height of this.#scanHeights) {
            for (const dir of rayDirections) {
                const raycaster = new THREE.Raycaster();
                raycaster.far = this.#collisionThreshold;
                raycaster.ray.direction.copy(dir);
                // Store the Y offset so we can position each ray at the right height each frame
                raycaster._scanHeight = height;
                this.#collisionRaycasters.push(raycaster);
            }
        }

        // Set up frame size
        this.#with = window.innerWidth;
        this.#height = window.innerHeight;

        //set up #camera
        this.#camera = new THREE.PerspectiveCamera(60, (this.#with / this.#height), 0.01, 10000000);
        this.#camera.name = "mainCamera";
        this.#camera.position.set(1, 2, 0);

        // Set up #scene
        this.#scene = new THREE.Scene();
        this.ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this.ambientLight.name = "mainLight";
        this.#scene.add(this.ambientLight);

        // Set up #renderer
        this.#renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.#renderer.domElement.id = 'svgObject';
        this.#renderer.sortObjects = false;
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize( this.#with, this.#height );
        this.#renderer.setClearColor(0xffffff, 0);
        this.#renderer.setViewport(0, 0, this.#with, this.#height);
        this.#renderer.gammaOutput = true;

        //set up controls
        // this.controls = new OrbitControls(this.#camera, this.#renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.70;
        // this.controls.enableZoom = true;
        // this.controls.enableRotate = true;
        // this.controls.enablePan = true;
        // this.controls.target.set(0,0,0);
    };

    getRenderer() {
        return this.#renderer;
    };

    getScene() {
        return this.#scene;
    };

    getCamera() {
        return this.#camera;
    }

    getFloor() {
        return this.#floor;
    };

    getAvatar() {
        return this.#avatar;
    };

    getAvatarMixerConfig() {
        return this.#avatarAnimConfig;
    };

    addFloorToScene(officeName) {
        return new Promise((resolve) => {

            const mtlLoader = new MTLLoader();

            mtlLoader.setPath('/models/');
            mtlLoader.setMaterialOptions ( { side: THREE.DoubleSide } );
            mtlLoader.load(officeName+'.mtl', (materials) => {

                materials.preload();

                const objLoader = new OBJLoader();

                objLoader.setMaterials(materials);
                objLoader.setPath('/models/');
                objLoader.load(officeName+'.obj', (officeObjects) => {
                    officeObjects.children.map((plantObject) => {
                        plantObject.name = plantObject.name.replace(/_[a-z]*.[0-9]*/gi, "");
                        if( plantObject.name.match("interact")){
                            this.#interactiveObjects.push(plantObject);
                        }
                        plantObject.name = plantObject.name.replace('interact','');
                        if(Array.isArray(plantObject.material)){
                            plantObject.material.map((mat) => {
                                if(mat.name.substring(0,11) == 'transparent') mat.transparent = true;
                            });
                        }
                        else if(plantObject.material.name.substring(0,11) == 'transparent') plantObject.material.transparent = true;
                        
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
        }

        return new Promise((resolve) => {
            this.#scene.remove(this.#avatar);
            this.#avatar = new THREE.Object3D();
            this.#avatar.name = "avatarGroup";

            // Load body and head models in parallel and add them to the #avatar group once both are loaded
            Promise.all([
                loadPromise(`/models/avatars/bodies/${bodyName}.glb`),
                loadPromise(`/models/avatars/heads/${headName}.glb`)
            ]).then(([bodyGltf, headGltf]) => {
                const headModel = headGltf.scene;
                headModel.name = 'head';
                const bodymodel = bodyGltf.scene;
                bodymodel.name = 'body';

                Object.assign(this.#avatarAnimConfig, { 
                    head: {
                        mixer: new THREE.AnimationMixer(headModel),
                        animations: headGltf.animations
                    },
                    body: {
                        mixer: new THREE.AnimationMixer(bodymodel),
                        animations: bodyGltf.animations
                    }
                });

                //adding cube inside #avatar model to check collisions
                const collisionCubeGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
                const collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
                const collisionCube = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
                collisionCube.name = userName;
                collisionCube.visible = false;
                collisionCube.position.y = 0.06;

                // add head and body to #avatar group and #avatar to #scene
                this.#avatar.add(bodymodel, headModel, collisionCube);
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

        let lastTime = 0;
        const fpsInterval = 1000 / 30;

        this.#renderer.setAnimationLoop((time) => {

            this.clock.update();

            const delta = this.clock.getDelta();

            if (this.#avatarAnimConfig.body.mixer && this.#avatarAnimConfig.head.mixer) {
                this.#avatarAnimConfig.body.mixer.update(delta);
                this.#avatarAnimConfig.head.mixer.update(delta)
            }

            if (time - lastTime < fpsInterval) return;
            
            lastTime = time;

            if (this.controls) this.controls.update();

            this.#checkAvatarCollision();

            this.#camera.lookAt(this.#avatar.position);

            this.#renderer.render(this.#scene, this.#camera);
        });
    };

    #checkAvatarCollision = () => {
        const collisionCube = this.#avatar.children.find(child => child.name === this.#userName);
        if (!collisionCube || this.#interactiveObjects.length === 0) return;

        // Get the avatar's world position (XZ base, Y=0 at avatar root).
        // We apply the scan heights manually per raycaster below.
        this.#avatar.updateWorldMatrix(true, false);
        const avatarWorldPos = new THREE.Vector3();
        this.#avatar.getWorldPosition(avatarWorldPos);

        // Track which interactive objects have already triggered this frame
        // so we don't log/callback the same object multiple times per frame.
        const alreadyHit = new Set();

        for (const raycaster of this.#collisionRaycasters) {
            // Position each ray at the avatar XZ center + the ray's own scan height offset
            raycaster.ray.origin.set(
                avatarWorldPos.x,
                avatarWorldPos.y + raycaster._scanHeight,
                avatarWorldPos.z
            );

            const hits = raycaster.intersectObjects(this.#interactiveObjects, true);

            if (hits.length > 0) {
                // Walk up to the direct child of #interactiveObjects to get the named parent
                let hitObject = hits[0].object;
                while (hitObject.parent && !this.#interactiveObjects.includes(hitObject)) {
                    hitObject = hitObject.parent;
                }

                if (!alreadyHit.has(hitObject)) {
                    alreadyHit.add(hitObject);
                    console.log('hay colision con', hitObject.name, '| altura:', raycaster._scanHeight, '| distancia:', hits[0].distance.toFixed(4));
                }
            }
        }
    };
}
