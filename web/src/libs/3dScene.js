import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Objetos huecos: el avatar se mueve dentro de ellos, por lo que un Box3
// siempre intersectaría. Para estos usamos raycasters cortos en lugar de Box3.
const HOLLOW_OBJECTS = ['interactparedes', 'interactcristaleras'];

// Las 4 direcciones de movimiento del avatar mapeadas a su vector world-space.
// Deben coincidir con los ejes usados en UserControls#applyMovement.
// forward = X negativo, backward = X positivo, left = Z positivo, right = Z negativo
const MOVE_DIRECTIONS = {
    forward:  new THREE.Vector3(-1, 0,  0),
    backward: new THREE.Vector3( 1, 0,  0),
    left:     new THREE.Vector3( 0, 0,  1),
    right:    new THREE.Vector3( 0, 0, -1),
};

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

    // Referencia a UserControls para notificar bloqueos/desbloqueos de dirección
    #userControls = null;

    #hollowRaycasters;
    #collisionThreshold = 0.05;

    // Raycasters con mayor alcance para detectar si el avatar YA SE ALEJÓ de una superficie.
    // Mismo umbral + pequeño margen para que el desbloqueo ocurra antes de separarse del todo.
    #releaseThreshold = 0.08;

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

        const rayDirections = [
            new THREE.Vector3( 1,  0,  0),
            new THREE.Vector3(-1,  0,  0),
            new THREE.Vector3( 0,  0,  1),
            new THREE.Vector3( 0,  0, -1),
            new THREE.Vector3( 1,  0,  1).normalize(),
            new THREE.Vector3(-1,  0,  1).normalize(),
            new THREE.Vector3( 1,  0, -1).normalize(),
            new THREE.Vector3(-1,  0, -1).normalize(),
        ];

        this.#hollowRaycasters = rayDirections.map((dir) => {
            const raycaster = new THREE.Raycaster();
            raycaster.far = this.#collisionThreshold;
            raycaster.ray.direction.copy(dir);
            return raycaster;
        });

        this.#with = window.innerWidth;
        this.#height = window.innerHeight;

        this.#camera = new THREE.PerspectiveCamera(60, (this.#with / this.#height), 0.01, 10000000);
        this.#camera.name = "mainCamera";
        this.#camera.position.set(1, 2, 0);

        this.#scene = new THREE.Scene();
        this.ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this.ambientLight.name = "mainLight";
        this.#scene.add(this.ambientLight);

        this.#renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.#renderer.domElement.id = 'svgObject';
        this.#renderer.sortObjects = false;
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize( this.#with, this.#height );
        this.#renderer.setClearColor(0xffffff, 0);
        this.#renderer.setViewport(0, 0, this.#with, this.#height);
        this.#renderer.gammaOutput = true;
    };

    getRenderer() { return this.#renderer; };
    getScene()    { return this.#scene; };
    getCamera()   { return this.#camera; }
    getFloor()    { return this.#floor; };
    getAvatar()   { return this.#avatar; };
    getAvatarMixerConfig() { return this.#avatarAnimConfig; };

    // Conecta UserControls para que #checkAvatarCollision pueda bloquear/desbloquear direcciones.
    // Se llama desde main.js después de crear ambas instancias.
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

                            if (isHollow) {
                                plantObject.userData.collisionType = 'hollow';
                            } else {
                                plantObject.userData.collisionType = 'solid';
                                plantObject.userData.collisionBox = new THREE.Box3().setFromObject(plantObject);
                            }

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

                const collisionCubeGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
                const collisionCubeMaterial = new THREE.MeshLambertMaterial({color: 0xff2255});
                const collisionCube = new THREE.Mesh(collisionCubeGeometry, collisionCubeMaterial);
                collisionCube.name = userName;
                collisionCube.visible = false;
                collisionCube.position.y = 0.06;

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
                this.#avatarAnimConfig.head.mixer.update(delta);
            }

            if (time - lastTime < fpsInterval) return;
            lastTime = time;

            if (this.controls) this.controls.update();

            this.#checkAvatarCollision();

            this.#camera.lookAt(this.#avatar.position);
            this.#renderer.render(this.#scene, this.#camera);
        });
    };

    // Dado un vector dirección world-space del impacto, devuelve qué dirección
    // de movimiento del avatar corresponde ('forward'|'backward'|'left'|'right'|null).
    // Se elige la dirección cuyo vector tenga mayor dot product con el impacto.
    #worldVectorToMoveDirection = (hitVector) => {
        let bestDir = null;
        let bestDot = 0.3; // umbral mínimo para evitar falsos positivos en diagonales

        for (const [dir, vec] of Object.entries(MOVE_DIRECTIONS)) {
            const dot = hitVector.dot(vec);
            if (dot > bestDot) {
                bestDot = dot;
                bestDir = dir;
            }
        }
        return bestDir;
    };

    #checkAvatarCollision = () => {
        const collisionCube = this.#avatar.children.find(child => child.name === this.#userName);
        if (!collisionCube || this.#interactiveObjects.length === 0) return;

        // Conjunto de direcciones con colisión activa este frame
        const activeCollisions = new Set();

        // --- Objetos SÓLIDOS: Box3 vs Box3 ---
        this.#playerBox.setFromObject(collisionCube);

        collisionCube.updateWorldMatrix(true, false);
        const avatarPos = new THREE.Vector3();
        collisionCube.getWorldPosition(avatarPos);

        const solidObjects = this.#interactiveObjects.filter(o => o.userData.collisionType === 'solid');
        for (const obj of solidObjects) {
            if (this.#playerBox.intersectsBox(obj.userData.collisionBox)) {
                // Calcular el vector del centro del objeto al avatar para saber la dirección del impacto
                const objCenter = new THREE.Vector3();
                obj.userData.collisionBox.getCenter(objCenter);
                const hitVector = new THREE.Vector3().subVectors(avatarPos, objCenter).normalize();
                hitVector.y = 0;

                const dir = this.#worldVectorToMoveDirection(hitVector);
                if (dir) activeCollisions.add(dir);
            }
        }

        // --- Objetos HUECOS: raycasting lateral ---
        const hollowObjects = this.#interactiveObjects.filter(o => o.userData.collisionType === 'hollow');

        if (hollowObjects.length > 0) {
            for (const raycaster of this.#hollowRaycasters) {
                raycaster.ray.origin.copy(avatarPos);
                const hits = raycaster.intersectObjects(hollowObjects, true);

                if (hits.length > 0) {
                    // La dirección del raycaster apunta hacia el objeto → el avatar
                    // se mueve en esa dirección → hay que bloquearla
                    const dir = this.#worldVectorToMoveDirection(raycaster.ray.direction);
                    if (dir) activeCollisions.add(dir);
                }
            }
        }

        // --- Sincronizar bloqueos con UserControls ---
        if (!this.#userControls) return;

        for (const dir of Object.keys(MOVE_DIRECTIONS)) {
            if (activeCollisions.has(dir)) {
                this.#userControls.blockDirection(dir);
            } else {
                this.#userControls.unblockDirection(dir);
            }
        }
    };
}
