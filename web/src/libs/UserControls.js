export class UserControls {

    #loopId;
    #keyActive;
    #validMovementKeys;
    #movementBlocked = false;
    #movementDirection;

    constructor({avatar, camera, mixer}) {

        this.avatar = avatar;
        this.camera = camera;
        this.animConfig = mixer;
        this.moveSpeed = 0.01;

        this.#validMovementKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'];

        this.#keyActive = null;

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
        return this.#keyActive;
    }

    #activeMixerAnimation = (action) => {
        const bodyMixer = this.animConfig.body.animations.find(a => a.name === this.action);
        const headMixer = this.animConfig.head.animations.find(a => a.name === this.action);
        const BodyAnimation = !!bodyMixer ? this.animConfig.body.mixer.clipAction(bodyMixer) : undefined;
        const HeadAnimation = !!headMixer ? this.animConfig.head.mixer.clipAction(headMixer) : undefined;
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
        const rotationDegrees = {
            'up': -Math.PI / 2,
            'down': Math.PI / 2,
            'left': 0,
            'right': Math.PI
        }[this.#keyActive];

        this.avatar.rotation.y = rotationDegrees;
    }

    #applyMovement = () => {
        const keys = this.#keyActive;

        if (!this.#keyActive) return;

        this.#RotateMovement();

        if (this.#movementBlocked) return;

        const dx = {
            'up': -1,
            'down': 1,
        }[keys] || 0;

        const dz = {
            'left': 1,
            'right': -1
        }[keys] || 0;

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
        this.#keyActive = null;
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
        if (!this.#keyActive && !this.#validMovementKeys.includes(event.code)) return;
        this.#keyActive = this.#convertKeyToDirection(event.code);
    };

    #onKeyUp = (event) => {
        if (!this.#validMovementKeys.includes(event.code)) return;
        if (this.#convertKeyToDirection(event.code) != this.#keyActive) return;
        this.#keyActive = null;
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
