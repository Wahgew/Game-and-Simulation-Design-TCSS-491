class Player {
    constructor(game, x, y) {
        Object.assign(this, {game, x, y});

        this.height = 76;
        this.width = 20;

        this.game.Player = this;

        // Load individual spritesheets for each action
        this.idleSpritesheet = ASSET_MANAGER.getAsset("./sprites/idle.png");
        this.runSpritesheet = ASSET_MANAGER.getAsset("./sprites/run.png");
        this.jumpSpritesheet = ASSET_MANAGER.getAsset("./sprites/jump.png");

        this.facing = 1; // 0 = left, 1 = right
        this.state = 0; // 0 = idle, 1 = walking, 2 = running, 3 = skidding, 4 = jumping/falling, 5 = crouching/sliding
        this.dead = false;
        this.isGrounded = true;
        this.fallAcc = 550;

        this.velocity = {x: 0, y: 0};
        this.animations = [];
        this.loadAnimations();

        this.map = this.game.entities.find(entity => entity instanceof testMap);
        if (this.map) {
            console.log("Map found, tile size:", this.map.testSize);
        } else {
            console.error("Map not found");
        }
    }

    loadAnimations() {
        // Create a 3D array to store animations by [state][size][direction]
        for (let i = 0; i < 7; i++) {
            this.animations.push([]);
            for (let j = 0; j < 3; j++) {
                this.animations[i].push([]);
                for (let k = 0; k < 2; k++) {
                    this.animations[i][j].push(null);
                }
            }
        }

        // Idle animation
        this.animations[0][0][1] = new Animator(
            this.idleSpritesheet, 
            0, 5, 170, 175, 2, 0.17
        );
        this.animations[0][0][0] = new Animator(
            this.idleSpritesheet,
            0, 0, 181, 175, 5, 0.17
        );

        // Run animation
        this.animations[1][0][1] = new Animator(
            this.runSpritesheet,
            0, 0, 181, 175, 5, 0.1
        );
        this.animations[1][0][0] = new Animator(
            this.runSpritesheet,
            0, 0, 181, 175, 5, 0.1
        );

        // Jump animation - copy for all states that need it
        for (let i = 2; i <= 4; i++) {
            this.animations[i][0][1] = new Animator(
                this.jumpSpritesheet,
                0, 0, 181, 175, 2, 0.2
            );
            this.animations[i][0][0] = new Animator(
                this.jumpSpritesheet,
                0, 0, 181, 175, 2, 0.2
            );
        }
    }

    update() {
        const TICK = this.game.clockTick;

        // Movement constants
        const MIN_WALK = 20;
        const MAX_WALK = 500;
        const MAX_RUN = 1000;
        const ACC_WALK = 650;
        const ACC_RUN = 1250;
        const DEC_REL = 900;
        const DEC_SKID = 1800;
        const MAX_FALL = 2000;
        const GRAVITY = 1500;
        const MAX_JUMP = 750;

        // Jump input handling
        if ((this.game.keys['space'] || this.game.keys['w']) && this.isGrounded) {
            this.velocity.y = -MAX_JUMP;
            this.state = 4; // Set to jumping state
            this.isGrounded = false;
        }

        // HORIZONTAL MOVEMENT
        if (Math.abs(this.velocity.x) < MIN_WALK) {
            this.velocity.x = 0;
            if (!this.state === 4) this.state = 0;
            if (this.game.keys['a'] && !this.game.keys['s']) {
                this.velocity.x -= MIN_WALK;
            }
            if (this.game.keys['d'] && !this.game.keys['s']) {
                this.velocity.x += MIN_WALK;
            }
        } else {
            if (this.facing === 0) {
                if (this.game.keys['a'] && !this.game.keys['d'] && !this.game.keys['s']) {
                    if (this.game.keys['shift']) {
                        this.velocity.x -= ACC_RUN * TICK;
                        if (!this.state === 4) this.state = 2;
                    } else {
                        this.velocity.x -= ACC_WALK * TICK;
                        if (!this.state === 4) this.state = 1;
                    }
                } else if (this.game.keys['d'] && !this.game.keys['a'] && !this.game.keys['s']) {
                    this.velocity.x += DEC_SKID * TICK;
                    if (!this.state === 4) this.state = 3;
                } else {
                    this.velocity.x += DEC_REL * TICK;
                    if (!this.state === 4) this.state = 1;
                }
            }
            if (this.facing === 1) {
                if (this.game.keys['d'] && !this.game.keys['a'] && !this.game.keys['s']) {
                    if (this.game.keys['shift']) {
                        this.velocity.x += ACC_RUN * TICK;
                        if (!this.state === 4) this.state = 2;
                    } else {
                        this.velocity.x += ACC_WALK * TICK;
                        if (!this.state === 4) this.state = 1;
                    }
                } else if (this.game.keys['a'] && !this.game.keys['d'] && !this.game.keys['s']) {
                    this.velocity.x -= DEC_SKID * TICK;
                    if (!this.state === 4) this.state = 3;
                } else {
                    this.velocity.x -= DEC_REL * TICK;
                    if (!this.state === 4) this.state = 1;
                }
            }
        }

        // Apply gravity
        this.velocity.y += GRAVITY * TICK;

        // Max velocity calculations
        if (this.velocity.x >= MAX_RUN) this.velocity.x = MAX_RUN;
        if (this.velocity.x <= -MAX_RUN) this.velocity.x = -MAX_RUN;
        if (this.velocity.x >= MAX_WALK && !this.game.keys['shift']) this.velocity.x = MAX_WALK;
        if (this.velocity.x <= -MAX_WALK && !this.game.keys['shift']) this.velocity.x = -MAX_WALK;
        if (this.velocity.y >= MAX_FALL) this.velocity.y = MAX_FALL;

        // Calculate next position
        let nextX = this.x + this.velocity.x * TICK;
        let nextY = this.y + this.velocity.y * TICK;

        // Get map dimensions
        const mapWidth = this.map.map[0].length * this.map.testSize;
        const mapHeight = this.map.map.length * this.map.testSize;

        // Constrain to map boundaries
        nextX = Math.max(0, Math.min(nextX, mapWidth - this.width));
        nextY = Math.max(0, Math.min(nextY, mapHeight - this.height));

        // Create bounding boxes for collision
        const horizontalBB = new BoundingBox(nextX, this.y, this.width, this.height);
        const verticalBB = new BoundingBox(this.x, nextY, this.width, this.height);

        // Check collisions and update position
        const horizontalCollision = this.map.checkCollisions({
            BB: horizontalBB,
            x: nextX,
            y: this.y,
            width: this.width,
            height: this.height
        });

        const verticalCollision = this.map.checkCollisions({
            BB: verticalBB,
            x: this.x,
            y: nextY,
            width: this.width,
            height: this.height
        });

        // Apply horizontal movement
        if (horizontalCollision.collides) {
            if (this.velocity.x > 0) {
                this.x = horizontalCollision.tileX - this.width;
            } else if (this.velocity.x < 0) {
                this.x = horizontalCollision.tileX + this.map.testSize;
            }
            this.velocity.x = 0;
        } else {
            this.x = nextX;
        }

        // Apply vertical movement
        if (verticalCollision.collides) {
            if (this.velocity.y > 0) {
                this.y = verticalCollision.tileY - this.height;
                this.velocity.y = 0;
                this.isGrounded = true;
                // Update state when landing
                if (this.state === 4) {
                    if (Math.abs(this.velocity.x) > MAX_WALK) {
                        this.state = 2;
                    } else if (Math.abs(this.velocity.x) > MIN_WALK) {
                        this.state = 1;
                    } else {
                        this.state = 0;
                    }
                }
            } else if (this.velocity.y < 0) {
                this.y = verticalCollision.tileY + this.map.testSize;
                this.velocity.y = 0;
            }
        } else {
            this.y = nextY;
            if (this.y + this.height < mapHeight) {
                this.isGrounded = false;
                if (this.velocity.y > 0) {
                    this.state = 4; // Set to jumping/falling state when in air
                }
            }
        }

        // Update facing direction
        if (this.velocity.x < 0) this.facing = 0;
        if (this.velocity.x > 0) this.facing = 1;

        // Update bounding box
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    draw(ctx) {
        if (!ctx) return;

        // Make sure we have a valid animation for the current state
        if (this.animations[this.state] && 
            this.animations[this.state][0] && 
            this.animations[this.state][0][this.facing]) {
            
            this.animations[this.state][0][this.facing].drawFrame(
                this.game.clockTick,
                ctx,
                this.x - 37,
                this.y,
                0.5
            );
        } else {
            // Fallback to idle animation if current state animation is missing
            this.animations[0][0][this.facing].drawFrame(
                this.game.clockTick,
                ctx,
                this.x - 37,
                this.y,
                0.5
            );
        }

        if (this.game.options.debugging) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}