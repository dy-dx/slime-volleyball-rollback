const skyColor = '#00f';
// const backTextColor = '#000';
const groundColor = '#888';
// const ballColor = '#fff';
// const newGroundColor = '#ca6';
const TWO_PI = Math.PI * 2;
export default class RenderSystem {
    constructor(game, elem) {
        if (!elem) {
            throw new Error();
        }
        this.gameElement = elem;
        this.game = game;
        const canvas = document.createElement('canvas');
        canvas.width = game.width;
        canvas.height = game.height;
        canvas.className = 'canvas';
        this.gameElement.appendChild(canvas);
        this.ctx = canvas.getContext('2d');
    }
    update(entities, _dt) {
        this.renderBackground(this.ctx);
        const renderables = entities.filter((e) => !!e.appearanceComp);
        const ball = renderables.find((e) => !!e.isBall);
        const slimes = renderables.filter((e) => !!(e.characterDefinitionComp && e.physicsComp));
        if (ball) {
            this.renderBall(this.ctx, ball.appearanceComp, ball.physicsComp, ball.positionComp);
        }
        slimes.forEach((e) => {
            this.renderSlime(this.ctx, ball?.positionComp || { x: 0, y: 0 }, e.appearanceComp, e.physicsComp, e.positionComp);
            // const elem = this.findOrCreateElement(e);
            // this.setStyles(elem, e.appearanceComp, e.positionComp);
        });
    }
    renderBackground(ctx) {
        const { width: viewWidth, height: viewHeight } = this.game;
        const courtYPix = (4 * viewHeight) / 5; // ???
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, viewWidth, courtYPix);
        ctx.fillStyle = groundColor;
        ctx.fillRect(0, courtYPix, viewWidth, viewHeight - courtYPix);
        ctx.fillStyle = '#fff';
        ctx.fillRect(viewWidth / 2 - 2, (7 * viewHeight) / 10, 4, viewHeight / 10 + 5);
        // render scores
        // renderPoints(slimeLeftScore, 30, 40);
        // renderPoints(slimeRightScore, viewWidth - 30, -40);
        ctx.fillStyle = '#000';
    }
    renderBall(ctx, appearanceComp, physicsComp, positionComp) {
        const { width: viewWidth, height: viewHeight, gameWidth, gameHeight } = this.game;
        const courtYPix = (4 * viewHeight) / 5; // ???
        const pixelsPerUnitX = viewWidth / gameWidth;
        const pixelsPerUnitY = viewHeight / gameHeight;
        const xPix = positionComp.x * pixelsPerUnitX;
        const yPix = courtYPix - positionComp.y * pixelsPerUnitY;
        // The original game's ball looked bigger then
        // it was, so we add 2 pixels here to the radius
        const radiusPix = physicsComp.radius * pixelsPerUnitY + 2;
        ctx.fillStyle = appearanceComp.color || '#000';
        ctx.beginPath();
        ctx.arc(xPix, yPix, radiusPix, 0, TWO_PI);
        ctx.fill();
    }
    renderSlime(ctx, ballPos, appearanceComp, physicsComp, positionComp) {
        const { width: viewWidth, height: viewHeight, gameWidth, gameHeight } = this.game;
        const courtYPix = (4 * viewHeight) / 5; // ???
        const pixelsPerUnitX = viewWidth / gameWidth;
        const pixelsPerUnitY = viewHeight / gameHeight;
        const xPix = positionComp.x * pixelsPerUnitX;
        const yPix = courtYPix - positionComp.y * pixelsPerUnitY;
        const { radius } = physicsComp;
        const { x, y } = positionComp;
        const radiusPix = radius * pixelsPerUnitY;
        ctx.fillStyle = appearanceComp.color || '#000';
        ctx.beginPath();
        ctx.arc(xPix, yPix, radiusPix, Math.PI, TWO_PI);
        ctx.fill();
        // Draw Eyes
        const onLeft = positionComp.x < this.game.gameWidth / 2;
        const eyeX = x + ((onLeft ? 1 : -1) * radius) / 4;
        const eyeY = y + radius / 2;
        const eyeXPix = eyeX * pixelsPerUnitX;
        const eyeYPix = courtYPix - eyeY * pixelsPerUnitY;
        ctx.translate(eyeXPix, eyeYPix);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, radiusPix / 4, 0, TWO_PI);
        ctx.fill();
        // Draw Pupil
        const dx = ballPos.x - eyeX;
        const dy = eyeY - ballPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const rPixOver8 = radiusPix / 8;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc((rPixOver8 * dx) / dist, (rPixOver8 * dy) / dist, rPixOver8, 0, TWO_PI);
        ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
//# sourceMappingURL=render.system.js.map