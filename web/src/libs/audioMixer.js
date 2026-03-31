export class SoundManager {

    #context = null;

    #getContext() {
        if (!this.#context) {
            const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
            this.#context = new AudioCtx();
        }
        return this.#context;
    }

    async playFX(url = '/audio/stairs.mp3') {
        try {
            const ctx = this.#getContext();
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await ctx.decodeAudioData(arrayBuffer);

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        } catch(e) {
            console.log("Error reproduciendo FX:", e);
        }
    }
}
