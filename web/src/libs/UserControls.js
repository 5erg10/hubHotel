export class UserControls {

    #loopId = null;
    #keysActive = new Set();

    constructor({avatar, camera, mixer}) {

        this.avatar = avatar;
        this.camera = camera;
        this.animConfig = mixer;
        this.moveSpeed = 0.01;

        this.#keysActive = new Set();

        this.move = {
            forward:  { block: false },
            backward: { block: false },
            left:     { block: false },
            right:    { block: false }
        };

        this.direction = { x: 0, y: 0, z: 0 };
        this.action = "stand";
        this.#loopId = null;
    };

    getDirection() { return this.direction; };

    getAction()    { return this.action; };

    blockDirection = (dir) => {
        if (this.move[dir]) this.move[dir].block = true;
    };

    unblockDirection = (dir) => {
        if (this.move[dir]) this.move[dir].block = false;
    };

    getMainKeyActive() {
        return this.#keysActive;
    }

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

    #applyMovement = () => {
        const keys = this.#keysActive;
        if (keys.size === 0) return;

        let dx = 0, dz = 0;
        let moving = false;

        if ((keys.has('ArrowUp')    || keys.has('KeyW')) && !this.move.forward.block)  { dx = -1; this.avatar.rotation.y = -Math.PI / 2; moving = true; }
        if ((keys.has('ArrowDown')  || keys.has('KeyS')) && !this.move.backward.block) { dx =  1; this.avatar.rotation.y =  Math.PI / 2; moving = true; }
        if ((keys.has('ArrowLeft')  || keys.has('KeyA')) && !this.move.left.block)     { dz =  1; this.avatar.rotation.y = 0;            moving = true; }
        if ((keys.has('ArrowRight') || keys.has('KeyD')) && !this.move.right.block)    { dz = -1; this.avatar.rotation.y =  Math.PI;     moving = true; }

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

    stopMovement = () => {
        this.#keysActive.clear();
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
        if (event.repeat) return;
        this.#keysActive.add(event.code);
    };

    #onKeyUp = (event) => {
        this.#keysActive.delete(event.code);
        const movementKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];
        if (!movementKeys.some(k => this.#keysActive.has(k))) {
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
