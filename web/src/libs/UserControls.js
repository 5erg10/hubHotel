export class UserControls {
    constructor({avatar, camera, mixer}) {

        this.avatar = avatar;

        this.camera = camera;

        this.animConfig = mixer;

        this.moveSpeed = 0.02;

        this.keyPressed = 'none';

        this.move = {
            forward: {init: 0, block: false},
            backward: {init: 0, block: false},
            left: {init: 0, block: false},
            right: {init: 0, block: false}
        };

        this.direction = { "x":0, "y":0, "z":0 };
        this.action = "stand";
    };

    getDirection() {
        return this.direction;
    };

    getAction() {
        return this.action;
    };

    blockIfCollision = () => {
        this.avatar.position.z -= this.direction.z * 1;
        this.avatar.position.x += this.direction.x * 1;
        blockMovement(this.direction);
        this.direction = { "x":0, "y":0, "z":0 };
    }

    // action must be 'play' or 'stop'
    #activeMixerAnimation = (action) => {
        const BodyAnimation = this.animConfig.body.mixer.clipAction(this.animConfig.body.animations.find(animation => animation.name === this.action));
        const HeadAnimation = this.animConfig.head.mixer.clipAction(this.animConfig.head.animations.find(animation => animation.name === this.action));
        if( action === 'stop' || !BodyAnimation?.isRunning()) {
            if(HeadAnimation) {
                if(this,action == 'jump') HeadAnimation.setEffectiveTimeScale(3)
                HeadAnimation[action]();
            }
            if(BodyAnimation) {
                if(this,action == 'jump') BodyAnimation.setEffectiveTimeScale(3)
                BodyAnimation[action]();
            }
        }
    }

    movements = (key) => {

        const actions = {
            ['true']: () => { console.log('no configured key: ', key) },
            [['ArrowUp', 'KeyW'].includes(key)]: () => {
                this.move.forward.init = this.move.forward.block ? 0 : -1;
                this.avatar.rotation.y = -Math.PI / 2; 
                this.action = "walk"; 
            },
            [['ArrowDown', 'KeyS'].includes(key)]: () => {
                this.move.backward.init = this.move.backward.block ? 0 : -1;
                this.avatar.rotation.y = Math.PI / 2;
                this.action = "walk";
            },
            [['ArrowLeft', 'KeyA'].includes(key)]: () => {
                this.move.left.init = this.move.left.block ? 0 : 1;
                this.avatar.rotation.y = 0;
                this.action = "walk";
            },
            [['ArrowRight', 'KeyD'].includes(key)]: () => {
                this.move.right.init = this.move.right.block ? 0 : 1;
                this.avatar.rotation.y = Math.PI;
                this.action = "walk";
            },
            [key === 'Space']: () => {
                this.action = "jump";
            }
        }['true']();

        this.direction.x = (this.move.forward.init - this.move.backward.init) * this.moveSpeed;
        this.direction.z = (this.move.left.init - this.move.right.init ) * this.moveSpeed;

        this.avatar.position.x += this.direction.x;
        this.avatar.position.z += this.direction.z;
        this.camera.position.x += this.direction.x;
        this.camera.position.z += this.direction.z;

        this.#activeMixerAnimation('play');
    };

    blockMovement = () => {
        const actions = {
            ['true']: () => { console.log('no configured key: ', this.keyPressed) },
            [['ArrowUp', 'KeyW'].includes(this.keyPressed)]: () => {
                this.move.forward.block = true;
            },
            [['ArrowDown', 'KeyS'].includes(this.keyPressed)]: () => {
                this.move.backward.block = true;
            },
            [['ArrowLeft', 'KeyA'].includes(this.keyPressed)]: () => {
                this.move.left.block = true;
            },
            [['ArrowRight', 'KeyD'].includes(this.keyPressed)]: () => {
                this.move.right.block = true;
            }
        }['true']();
    };

    stopMovement = () => {
        this.#activeMixerAnimation('stop');
        this.action = "stand";
        this.move.forward.init = 0;
        this.move.backward.init = 0;
        this.move.left.init = 0;
        this.move.right.init = 0;    
        this.direction.x = 0;
        this.direction.z = 0;
    };

    enableControls = () => {
        document.addEventListener('keydown', (event) => this.movements(event.code));
        document.addEventListener('keyup', (event) => this.stopMovement());
    };

    disableControls = () => {
        document.removeEventListener('keydown', (event) => this.movements(event.code));
        document.removeEventListener('keyup', (event) => this.stopMovement());
    };
};