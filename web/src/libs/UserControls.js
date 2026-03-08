export class UserControls {

    #loopId = null;
    #keysActive = new Set();
    #validMovementKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];
    #movementBlocked = false;
    #movementDirection;

    constructor({avatar, camera, mixer}) {

        this.avatar = avatar;
        this.camera = camera;
        this.animConfig = mixer;
        this.moveSpeed = 0.01;

        this.#validMovementKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'];

        this.#keysActive = new Set();

        this.#movementBlocked = false;

        this.#movementDirection;
        
        this.action = "stand";
        this.#loopId = null;
    };

    getAction()    { return this.action; };

    blockDirection = () => {
        this.#movementBlocked = true;
    };

    unblockDirection = () => {
        this.#movementBlocked = false;
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

    #RotateMovement = () => {
        const keys = this.#keysActive;
        const rotationDegrees = {
            [keys.has('up')]: -Math.PI / 2,
            [keys.has('down')]: Math.PI / 2,
            [keys.has('left')]: 0,
            [keys.has('right')]: Math.PI
        }['true'];

        this.avatar.rotation.y = rotationDegrees;
    }

    #applyMovement = () => {
        const keys = this.#keysActive;

        if (keys.size === 0) return;

        this.#RotateMovement();

        if (this.#movementBlocked) return;

        let dx = 0, dz = 0;

        if (keys.has('up')) { 
            dx = -1;
        }
        if (keys.has('down')) { 
            dx = 1;
        }
        if (keys.has('left')) {
            dz = 1;
        }
        if (keys.has('right')) {
            dz = -1;
        }

        if (keys.has('Space')) {
            this.action = "jump";
            this.#activeMixerAnimation('play');
            return;
        }

        this.action = "walk";

        this.avatar.position.x += dx * this.moveSpeed;
        this.avatar.position.z += dz * this.moveSpeed;
        this.camera.position.x += dx * this.moveSpeed;
        this.camera.position.z += dz * this.moveSpeed;

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
    };

    #convertKeyToDirection = (keyCode) => {
        return {
            [['ArrowUp','KeyW'].includes(keyCode)]: 'up',
            [['ArrowDown','KeyS'].includes(keyCode)]: 'down',
            [['ArrowLeft','KeyA'].includes(keyCode)]: 'left',
            [['ArrowRight','KeyD'].includes(keyCode)]: 'right'
        }['true'];
    }

    #onKeyDown = (event) => {
        if (event.repeat || !this.#validMovementKeys.includes(event.code)) return;
        this.#keysActive.add(this.#convertKeyToDirection(event.code));
    };

    #onKeyUp = (event) => {
        this.#keysActive.delete(this.#convertKeyToDirection(event.code));
        this.stopMovement();
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
