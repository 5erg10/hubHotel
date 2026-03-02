export class UserControls {
    constructor({avatar, camera, mixer}) {

        this.avatar = avatar;
        this.camera = camera;
        this.animConfig = mixer;
        this.moveSpeed = 0.02;

        // Set de teclas actualmente pulsadas. El movimiento se aplica cada frame
        // en el loop interno, no en el evento keydown, eliminando el key-repeat delay del SO.
        this.keysActive = new Set();

        this.move = {
            forward: {block: false},
            backward: {block: false},
            left: {block: false},
            right: {block: false}
        };

        this.direction = { x: 0, y: 0, z: 0 };
        this.action = "stand";

        this.#loopId = null;
    };

    // ID del requestAnimationFrame para poder cancelarlo en disableControls
    #loopId = null;

    getDirection() { return this.direction; };
    getAction()    { return this.action; };

    blockIfCollision = () => {
        this.avatar.position.z -= this.direction.z * 1;
        this.avatar.position.x += this.direction.x * 1;
        this.blockMovement();
        this.direction = { x: 0, y: 0, z: 0 };
    };

    #activeMixerAnimation = (action) => {
        const BodyAnimation = this.animConfig.body.mixer.clipAction(this.animConfig.body.animations.find(a => a.name === this.action));
        const HeadAnimation = this.animConfig.head.mixer.clipAction(this.animConfig.head.animations.find(a => a.name === this.action));
        if (action === 'stop' || !BodyAnimation?.isRunning()) {
            if (HeadAnimation) {
                if (this.action == 'jump') HeadAnimation.setEffectiveTimeScale(3);
                HeadAnimation[action]();
            }
            if (BodyAnimation) {
                if (this.action == 'jump') BodyAnimation.setEffectiveTimeScale(3);
                BodyAnimation[action]();
            }
        }
    };

    // Aplica el movimiento correspondiente a las teclas activas.
    // Se llama cada frame desde el loop interno — sin dependencia del key-repeat del SO.
    #applyMovement = () => {
        const keys = this.keysActive;
        if (keys.size === 0) return;

        let dx = 0, dz = 0;
        let moving = false;

        if ((keys.has('ArrowUp')   || keys.has('KeyW')) && !this.move.forward.block)  { dx = -1; this.avatar.rotation.y = -Math.PI / 2; moving = true; }
        if ((keys.has('ArrowDown') || keys.has('KeyS')) && !this.move.backward.block) { dx =  1; this.avatar.rotation.y =  Math.PI / 2; moving = true; }
        if ((keys.has('ArrowLeft') || keys.has('KeyA')) && !this.move.left.block)     { dz =  1; this.avatar.rotation.y = 0;            moving = true; }
        if ((keys.has('ArrowRight')|| keys.has('KeyD')) && !this.move.right.block)    { dz = -1; this.avatar.rotation.y =  Math.PI;     moving = true; }

        if (keys.has('Space')) {
            this.action = "jump";
            this.#activeMixerAnimation('play');
            return;
        }

        if (!moving) return;

        this.action = "walk";
        this.direction.x = dx * this.moveSpeed;
        this.direction.z = dz * this.moveSpeed;

        this.avatar.position.x += this.direction.x;
        this.avatar.position.z += this.direction.z;
        this.camera.position.x += this.direction.x;
        this.camera.position.z += this.direction.z;

        this.#activeMixerAnimation('play');
    };

    #loop = () => {
        this.#applyMovement();
        this.#loopId = requestAnimationFrame(this.#loop);
    };

    blockMovement = () => {
        if (this.keysActive.has('ArrowUp')    || this.keysActive.has('KeyW')) this.move.forward.block  = true;
        if (this.keysActive.has('ArrowDown')  || this.keysActive.has('KeyS')) this.move.backward.block = true;
        if (this.keysActive.has('ArrowLeft')  || this.keysActive.has('KeyA')) this.move.left.block     = true;
        if (this.keysActive.has('ArrowRight') || this.keysActive.has('KeyD')) this.move.right.block    = true;
    };

    stopMovement = () => {
        this.keysActive.clear();
        this.#activeMixerAnimation('stop');
        this.action = "stand";
        this.move.forward.block  = false;
        this.move.backward.block = false;
        this.move.left.block     = false;
        this.move.right.block    = false;
        this.direction.x = 0;
        this.direction.z = 0;
    };

    #onKeyDown = (event) => {
        // Ignorar repetición automática del SO — el movimiento ya lo gestiona el loop
        if (event.repeat) return;
        this.keysActive.add(event.code);
    };

    #onKeyUp = (event) => {
        this.keysActive.delete(event.code);
        // Si no queda ninguna tecla de movimiento pulsada, parar animación
        const movementKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];
        if (!movementKeys.some(k => this.keysActive.has(k))) {
            this.stopMovement();
        }
    };

    enableControls = () => {
        document.addEventListener('keydown', this.#onKeyDown);
        document.addEventListener('keyup',   this.#onKeyUp);
        this.#loopId = requestAnimationFrame(this.#loop);
    };

    disableControls = () => {
        document.removeEventListener('keydown', this.#onKeyDown);
        document.removeEventListener('keyup',   this.#onKeyUp);
        if (this.#loopId !== null) {
            cancelAnimationFrame(this.#loopId);
            this.#loopId = null;
        }
    };
};
