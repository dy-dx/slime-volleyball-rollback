import { CharacterState, } from '../components.js';
export default class CharacterStateSystem {
    update(entities, _dt) {
        const level = entities.find((e) => !!e.scoreComp);
        if (level && level.scoreComp.freezeTime > 0) {
            return;
        }
        entities
            .filter((e) => !!e.characterStateComp)
            .forEach((e) => {
            const pressed = e.inputComp;
            const { walkSpeed, jumpSpeed } = e.characterDefinitionComp;
            const physicsComp = e.physicsComp;
            const positionComp = e.positionComp;
            const stateComp = e.characterStateComp;
            if (stateComp.state === CharacterState.Jump && positionComp.y <= 0) {
                this.endJump(stateComp, physicsComp, positionComp);
            }
            if (pressed.up) {
                this.jump(stateComp, physicsComp, jumpSpeed);
            }
            if (pressed.left) {
                this.moveX(physicsComp, walkSpeed, 2 /* Left */);
            }
            else if (pressed.right) {
                this.moveX(physicsComp, walkSpeed, 3 /* Right */);
            }
            else {
                this.moveX(physicsComp, 0, 3 /* Right */);
            }
        });
    }
    moveX(physicsComp, walkSpeed, direction) {
        if (direction === 2 /* Left */) {
            physicsComp.velocityX = -walkSpeed;
        }
        else if (direction === 3 /* Right */) {
            physicsComp.velocityX = walkSpeed;
        }
    }
    jump(stateComp, physicsComp, jumpSpeed) {
        if (!this.setState(stateComp, CharacterState.Jump)) {
            return;
        }
        physicsComp.velocityY = jumpSpeed;
        physicsComp.accelerationY = -2;
    }
    endJump(stateComp, physicsComp, positionComp) {
        positionComp.y = 0; // Redundant if physics is working properly
        physicsComp.accelerationY = 0;
        physicsComp.velocityY = 0;
        this.setState(stateComp, CharacterState.Walk);
    }
    setState(stateComp, targetState) {
        if (this.canSetState(stateComp, targetState)) {
            stateComp.state = targetState;
            return true;
        }
        return false;
    }
    canSetState(stateComp, targetState) {
        if (targetState === CharacterState.Walk) {
            return [CharacterState.Jump].includes(stateComp.state);
        }
        else if (targetState === CharacterState.Jump) {
            return [CharacterState.Walk].includes(stateComp.state);
        }
        return false;
    }
}
//# sourceMappingURL=character-state.system.js.map