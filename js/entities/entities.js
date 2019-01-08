/**
 * Player Entity
 */
game.PlayerEntity = me.Entity.extend({
    /**
     * constructor
     */
    init: function(x, y, settings) {
        // call the constructor
        this._super(me.Entity, 'init', [x, y , settings]);
        
        // max walking/jump speed
        this.body.setMaxVelocity(2.5,15);
        this.body.setFriction(0.4,0);

        // set display to follow pos on both axis
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH, 0.4);

        this.facing = true; // left

        // ensure player is NOT updated outside the viewport
        this.alwaysUpdate = true;

        // define basic walking animation (some frames)
        this.renderable.addAnimation("walk", [4,3,2,0]);

        // define standing animation 
        this.renderable.addAnimation("stand", [0,1,2,3]);

        // define jump
        this.renderable.addAnimation("jump", [4,5]);

        // define hurt animation
        this.renderable.addAnimation("hurt", [6,5]);

        // set standing animation as default
        this.renderable.setCurrentAnimation("stand");
    },

    /**
     * update the entity
     */
    update: function(dt) {
        if (me.input.isKeyPressed("left")) {
            // unflip the sprite
            this.renderable.flipX(false);

            this.facing = true;

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

            this.facing = false;

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
            if (!this.renderable.isCurrentAnimation("jump")) {
                this.renderable.setCurrentAnimation("jump");
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
    onCollision: function(response, other) {
        switch (response.b.body.collisionType) {
          case me.collision.types.WORLD_SHAPE:
            // Simulate a platform object
            if (other.type === "platform") {
              if (this.body.falling &&
                !me.input.isKeyPressed('down') &&
      
                // Shortest overlap would move the player upward
                (response.overlapV.y > 0) &&
      
                // The velocity is reasonably fast enough to have penetrated to the overlap depth
                (~~this.body.vel.y >= ~~response.overlapV.y)
              ) {
                // Disable collision on the x axis
                response.overlapV.x = 0;
      
                // Respond to the platform (it is solid)
                return true;
              }
      
              // Do not respond to the platform (pass through)
              return false;
            }
            break;
      
          case me.collision.types.ENEMY_OBJECT:
            // bounce (force jump)
            if (this.facing && !this.renderable.isFlickering()) {
                this.body.vel.x = this.body.maxVel.x * me.timer.tick;    
            }
            else if (!this.facing && !this.renderable.isFlickering()) {
                this.body.vel.x = -this.body.maxVel.x * me.timer.tick;
            }
            this.body.vel.y = -(this.body.maxVel.y/2) * me.timer.tick;

            // set the jumping flag
            this.body.jumping = true;

            // let's flicker in case we touched an enemy
            this.renderable.flicker(750);
            if (!this.renderable.isCurrentAnimation("hurt")) {
                this.renderable.setCurrentAnimation("hurt");
            }
    
            // Fall through
      
          default:
            // Do not respond to other objects (e.g. fireflies)
            return false;
        }
      
        // Make the object solid
        return true;
    }
});

/**
 * Firefly entity
 */
game.FireflyEntity = me.CollectableEntity.extend({
    // extending the init function is not mandatory
    // unless you need to add some extra initialization
    init: function (x, y, settings) {
        // save the area size as defined in Tiled
        var width = settings.width;

        // define this here instead of tiled
        settings.image = "firefly";

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 16;
        settings.frameheight = settings.height = 16;

        // call the parent constructor
        this._super(me.CollectableEntity, 'init', [x, y, settings]);

        // add a physic body
        this.body = new me.Body(this);

        // set the entity body collision type
        this.body.collisionType = me.collision.types.COLLECTABLE_OBJECT;

        // add a default collision shape
        this.body.addShape(new me.Rect(0, 0, this.width, this.height));
        // configure max speed and friction
        this.body.setMaxVelocity(1, 1);
        this.body.setFriction(0, 0);
        // enable physic collision (off by default for basic me.Renderable)
        this.isKinematic = false;

        // set start/end position based on the initial area size
        y = this.pos.y;
        this.startY = y;
        this.pos.y = this.endY = y + (width/4) - (this.width/4);
        //this.pos.x  = x + width - this.width;

        // to remember which side we were walking
        this.slideDown = false;

        // make it "alive"
        this.aliveFly = true;
    },

    // manage the enemy movement
    update: function(dt) {
        if (this.aliveFly) {
            if (this.slideDown && this.pos.y <= this.startY) {
                this.slideDown = false;
                this.body.force.y = this.body.maxVel.y;
            }
            else if (!this.slideDown && this.pos.y >= this.endY){
                this.slideDown = true;
                this.body.force.y = -this.body.maxVel.y;
            }
        }
        else {
            this.body.force.y = 0;
        }

        // check & update movement
        this.body.update(dt);

        // return true if we moved or if the renderable was updated
        return (this._super(me.CollectableEntity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    // this function is called by the engine, when
    // an object is touched by something (here collected)
    onCollision: function(response, other) {
      // do something when collected
      // make sure it cannot be collected "again"
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
  
      // remove it
      me.game.world.removeChild(this);
  
      return false;
    }
});

/**
 * an enemy Bat Entity
 */
game.EnemyBatEntity = me.Sprite.extend({
    init: function (x, y, settings) {
        // save the area size as defined in Tiled
        var width = settings.width;

        // define this here instead of tiled
        settings.image = "bat";

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 32;
        settings.frameheight = settings.height = 32;

        // call the parent constructor
        this._super(me.Sprite, 'init', [x, y, settings]);

        // add a physic body
        this.body = new me.Body(this);

        // set the entity body collision type
        this.body.collisionType = me.collision.types.ENEMY_OBJECT;

        // add a default collision shape
        this.body.addShape(new me.Rect(0, 0, this.width, this.height));
        
        // configure max speed and friction
        this.body.setMaxVelocity(1, 2);
        this.body.setFriction(0.4, 0);
        
        // enable physic collision (off by default for basic me.Renderable)
        this.isKinematic = false;

        // set start/end position based on the initial area size
        x = this.pos.x;
        this.startX = x;
        this.pos.x = this.endX = x + width - this.width;
        //this.pos.x  = x + width - this.width;

        // to remember which side we were walking
        this.walkLeft = false;

        // make it "alive"
        this.alive = true;
    },

    // manage the enemy movement
    update: function(dt) {
        if (this.alive) {
            if (this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
                this.body.force.x = this.body.maxVel.x;
            }
            else if (!this.walkLeft && this.pos.x >= this.endX){
                this.walkLeft = true;
                this.body.force.x = -this.body.maxVel.x;
            }
            this.flipX(this.walkLeft);
        }
        else {
            this.body.force.x = 0;
        }

        // check & update movement
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Sprite, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * collision handler
     * (called when colliding with other objects)
     */
    onCollision: function(response, other) {
        if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            // res.y > 0 means touched by something on the bottom
            // which means at top position for this one
            if (this.alive && (response.overlapV.y > 0) && response.a.body.falling) {
                //this.renderable.flicker(750);
            }
            return false;
        }
        // Make all other objects solid
        return true;
    }
});

/**
 * an enemy Spider Entity
 */
game.EnemySpiderEntity = me.Sprite.extend({
    init: function (x, y, settings) {
        // save the area size as defined in Tiled
        var width = settings.width;

        // define this here instead of tiled
        settings.image = "spider";

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.framewidth = settings.width = 46;
        settings.frameheight = settings.height = 88;

        // call the parent constructor
        this._super(me.Sprite, 'init', [x, y, settings]);

        // add a physic body
        this.body = new me.Body(this);

        // set the entity body collision type
        this.body.collisionType = me.collision.types.ENEMY_OBJECT;

        // add a default collision shape (only want spider body though)
        this.body.addShape(new me.Rect(0, 88, this.width-10, this.height-10));
        // configure max speed and friction
        this.body.setMaxVelocity(0, 0);
        this.body.setFriction(0.4, 0);
        // enable physic collision (off by default for basic me.Renderable)
        this.isKinematic = false;

        // set start/end position based on the initial area size
        y = this.pos.y;
        this.startY = y;
        this.pos.y = this.endY = y + width - this.width;

        // to remember which side we were walking
        this.webDown = false;

        // make it "alive"
        this.alive = true;
    },

    // manage the enemy movement
    update: function(dt) {
        if (this.alive) {
            if (this.webDown && this.pos.y <= this.startY) {
                this.webDown = false;
                this.body.force.y = this.body.maxVel.y;
            }
            else if (!this.webDown && this.pos.y >= this.endY){
                this.webDown = true;
                this.body.force.y = -this.body.maxVel.y;
            }
        }
        else {
            this.body.force.y = 0;
        }

        // check & update movement
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Sprite, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

    /**
     * collision handler
     * (called when colliding with other objects)
     */
    onCollision: function(response, other) {
        if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            // res.y > 0 means touched by something on the bottom
            // which means at top position for this one
            if (this.alive && (response.overlapV.y > 0) && response.a.body.falling) {
                //this.renderable.flicker(750);
            }
            return false;
        }
        // Make all other objects solid
        return true;
    }
});
