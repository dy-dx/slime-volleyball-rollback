export default class ScoreSystem {
    constructor(game) {
        this.game = game;
    }
    update(entities) {
        const level = entities.find((e) => !!e.scoreComp);
        if (!level) {
            return;
        }
        const physicsEntities = entities.filter((e) => !!e.physicsComp);
        const ball = physicsEntities.find((e) => e.isBall);
        if (level.scoreComp.freezeTime === 0) {
            // Check for end of round
            if (ball && ball.positionComp.y <= 0) {
                level.scoreComp.freezeTime = 30;
            }
            return;
        }
        level.scoreComp.freezeTime -= 1;
        if (level.scoreComp.freezeTime <= 0) {
            if (ball.positionComp.x > 500) {
                level.scoreComp.p1Points += 1;
                this.game.initRound(0 /* P1 */);
            }
            else {
                level.scoreComp.p2Points += 1;
                this.game.initRound(1 /* P2 */);
            }
        }
    }
}
//# sourceMappingURL=score.system.js.map