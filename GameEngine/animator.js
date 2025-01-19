class Animator {
    constructor(spritesheet, xStart, yStart, width, height, frameCount, frameDuration) {
        Object.assign(this, {spritesheet, xStart, yStart, width, height, frameCount, frameDuration});

        this.elapsedTime = 0;
        this.totalTime = frameCount * frameDuration;
    }

    drawFrame(tick, ctx, x, y) {
        if (!ctx || !ctx.drawImage) {
            console.error("Invalid context passed to Animator.drawFrame");
            return;
        }

        if (!this.spritesheet || !this.spritesheet.complete) {
            console.log("Spritesheet not ready");
            return;
        }

        try {
            // Draw the sprite frame
            ctx.drawImage(
                this.spritesheet,
                this.xStart, this.yStart,    // Source X, Y
                this.width, this.height,     // Source width, height
                x, y,                        // Destination X, Y
                this.width, this.height      // Destination width, height
            );
        } catch (e) {
            console.error("Draw error:", e);
        }
    }

    currentFrame() {
        return Math.floor(this.elapsedTime / this.frameDuration) % this.frameCount;
    }

    isDone() {
        return (this.elapsedTime >= this.totalTime);
    }
}