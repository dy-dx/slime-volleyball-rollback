export default class Level {
    constructor(maxPoints = 7) {
        this.id = 0;
        this.scoreComp = {
            p1Points: 0,
            p2Points: 0,
            maxPoints,
            freezeTime: 0,
        };
    }
    // For easy state saving/loading, no instance methods allowed on entities!
    static reset(level) {
        level.scoreComp.p1Points = 0;
        level.scoreComp.p2Points = 0;
    }
}
//# sourceMappingURL=level.js.map