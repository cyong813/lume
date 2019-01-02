/**
 * Player Entity
 */
game.PlayerEntity = me.Entity.extend({

    /**
     * constructor
     */
    init:function (x, y, settings) {
        // call the constructor
        this._super(me.Entity, 'init', [x, y , settings]);
        
        // max walking/jump speed
        this.body.setMaxVelocity(3,15);
        this.body.setFriction(0.4,0);

        // set display to follow pos on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH, 0.4);

        // ensure player is NOT updated outside the viewport
        this.alwaysUpdate = false;

        // define basic walking animation (some frames)
        this.renderable.addAnimation("walk",[4,3,2,0]);

        // define standing animation 
        this.renderable.addAnimation("stand", [0,1,2,3]);

        // set standing animation as default
        this.renderable.setCurrentAnimation("stand");
    },

    /**
     * update the entity
     */
    update : function (dt) {
        if (me.input.isKeyPressed("left")) {
            // unflip the sprite
            this.renderable.flipX(false);

            // update default force
            this.body.force.x = -this.body.maxVel.x;
            // change to walking
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else if (me.input.isKeyPressed("right")) {
            // flip the sprite on horizontal axis
            this.renderable.flipX(true);

            this.body.force.x = this.body.maxVel.x;
            // change to walking
            if (!this.renderable.isCurrentAnimation("walk")) {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else {
            this.body.force.x = 0;
            // change to standing
            this.renderable.setCurrentAnimation("stand");
        }

        if (me.input.isKeyPressed("jump")) {
            if (!this.body.jumping && !this.body.falling) {
                // set current vel to max def val
                // gravity then does the rest
                this.body.force.y = -this.body.maxVel.y;
            }
        }
        else {
            this.body.force.y = 0;
        }

        // apply physics to the body (this moves the entity)
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

   /**
     * collision handler
     * (called when colliding with other objects)
     */
    onCollision : function (response, other) {
        // Make all other objects solid
        return true;
    }
});
