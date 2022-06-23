import { CharacterState, } from '../components.js';
export default class Character {
    constructor(side, x = 0, color = '#0f0') {
        this.id = 0;
        this.appearanceComp = {
            // width/height unused
            width: 0,
            height: 0,
            zIndex: 100,
            color,
        };
        this.inputComp = {
            left: false,
            up: false,
            right: false,
        };
        this.isControlledByClient = false;
        this.characterDefinitionComp = {
            name: 'Blah',
            walkSpeed: 8,
            jumpSpeed: 31,
        };
        this.characterStateComp = {
            state: CharacterState.Walk,
            side,
        };
        Character.reset(this, x);
    }
    // For easy state saving/loading, no instance methods allowed on entities!
    static reset(char, x = 0) {
        const side = char.characterStateComp.side;
        const defaultX = side === 0 /* P1 */ ? 200 : 800;
        char.characterStateComp.state = CharacterState.Walk;
        // from the original engine
        const wallDist = 50;
        const netDist = 55;
        const p1Range = { minX: wallDist, maxX: 500 - netDist };
        const p2Range = { minX: 500 + netDist, maxX: 1000 - wallDist };
        char.positionComp = {
            x: x || defaultX,
            y: 0,
            ...(char.characterStateComp.side === 0 /* P1 */ ? p1Range : p2Range),
        };
        char.physicsComp = {
            isMoveable: true,
            velocityX: 0,
            velocityY: 0,
            accelerationY: 0,
            maxSpeedX: Infinity,
            maxSpeedY: Infinity,
            radius: 100,
        };
    }
}
//# sourceMappingURL=character.js.map