export class SoundManager {

    #context;

    constructor() {
        this.#context = new (window.AudioContext || window.webkitAudioContext)();
    }

    async playFX(url = '/audio/stairs.mp3') {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.#context.decodeAudioData(arrayBuffer);

            const source = this.#context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.#context.destination);
            source.start(0);
        } catch(e) {
            console.log("Error reproduciendo FX:", e);
        }
    }
}