export default class Ball {
    constructor(x = 0, y = 0, color = '#ff0') {
        this.id = 0;
        this.appearanceComp = {
            // width/height unused
            width: 0,
            height: 0,
            zIndex: 100,
            color,
        };
        this.isBall = true;
        Ball.reset(this, x, y);
    }
    // For easy state saving/loading, no instance methods allowed on entities!
    static reset(ball, x = 0, y = 0) {
        ball.positionComp = {
            x,
            y: y || Ball.initialY,
        };
        ball.physicsComp = {
            isMoveable: true,
            velocityX: 0,
            velocityY: 0,
            accelerationY: -1,
            maxSpeedX: 15,
            maxSpeedY: 22,
            radius: 25,
        };
    }
}
Ball.initialY = 356;
//# sourceMappingURL=ball.js.map