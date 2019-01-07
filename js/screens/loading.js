// ref: https://github.com/MySweetWhomp/Schweinballoons/blob/master/js/screens/loading.js

(function() {
    var ProgressBar = me.Renderable.extend({
        init: function() {
            this._super(me.Renderable, 'init', [
                me.game.viewport.width / 2,
                me.game.viewport.height / 3,
                me.game.viewport.width / 6,
                32
            ]);

            this.z = 10;

            this.progress = 0; // current progress
            this.invalidate = false; // flag to know if we need to refresh the display
        },

        update: function() {
            if (this.invalidate) {
                this.invalidate = false;
                return true;
            }
            return false;
        },

        draw: function(renderer) {
            var color = renderer.getColor();
            var height = renderer.getHeight();
            // draw the progress bar
            renderer.setColor("gray");
            renderer.fillRect(me.game.viewport.width / 2, height / 3, this.width, this.height / 2);

            renderer.setColor("white");
            renderer.fillRect(me.game.viewport.width / 2, height / 3, this.progress, this.height / 2);

            renderer.setColor(color);
        },

        /**
         * make sure the screen is refreshed every frame
         */
        onProgressUpdate: function(progress) {
            this.progress = ~~(progress * (this.width));
            console.log(this.progress);
            this.invalidate = true;
        }
    });

    var Dot = me.Renderable.extend({
        init: function(x, y, index) {
            this._super(me.Renderable, 'init', [ x, y, 5, 5 ]);

            this.z = 10;

            this.alpha = +(index > 0);

            this.TIME_ON = 2500;
            this.TIME_OFF = 500;

            this.timer = this.TIME_ON - (index * this.TIME_OFF);
        },

        update: function(dt) {
            var ret = this._super(me.Renderable, 'update', [dt]);

            this.timer += dt;

            if (this.alpha && this.timer >= this.TIME_ON) {
                this.timer = this.alpha = 0;
                ret = true;
            } else if (!this.alpa && this.timer > this.TIME_OFF) {
                this.time = 0;
                this.alpha = 1;
                ret = true;
            }

            return ret;
        },

        draw: function(renderer) {
            renderer.save();

            renderer.setGlobalAlpha(this.alpha);

            renderer.setColor('white');
            renderer.fillRect(this.pos.x, this.pos.y, this.width, this.height);

            renderer.restore();
        }
    });

    game.LoadingScreen = me.ScreenObject.extend({
        /**
         *  action to perform on state change
         */
        onResetEvent: function() {
            me.game.reset();

            this.background = new me.ColorLayer('background', 'black', 1);
            this.progressBar = new ProgressBar();
            this.dots = [];

            me.game.world.addChild(this.background);
            me.game.world.addChild(this.progressBar);
            for (var i = 0; i < 5; ++i) {
                this.dots.push(new Dot(
                    (me.game.viewport.width / 2) - 28 + (i * 12),
                    me.game.viewport.height / 2 - 50,
                    i
                ));
                me.game.world.addChild(this.dots[i]);
            }

            this.loaderHdlr = me.event.subscribe(
                me.event.LOADER_PROGRESS,
                this.progressBar.onProgressUpdate.bind(this.progressBar)
            );
        },

        /**
         *  action to perform when leaving this screen (state change)
         */
        onDestroyEvent: function() {
            me.game.world.removeChild(this.background);
            me.game.world.removeChild(this.progressBar);
            for (var i = 0; i < this.dots.length; ++i) {
                me.game.world.removeChild(this.dots[i]);
            }
        }
    });
})();