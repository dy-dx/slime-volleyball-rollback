import {
  CharacterState,
  ICharacterDefinitionComp,
  ICharacterStateComp,
  IInputComp,
  IPhysicsComp,
  IPositionComp,
} from '../components.js';
import { IEntity } from '../entities/entity.js';
import ISystem from './system.js';

interface ICharacterEntity extends IEntity {
  characterDefinitionComp: ICharacterDefinitionComp;
  characterStateComp: ICharacterStateComp;
  inputComp: IInputComp;
  physicsComp: IPhysicsComp;
  positionComp: IPositionComp;
}

const enum Direction {
  Up,
  Down,
  Left,
  Right,
}
export default class CharacterStateSystem implements ISystem {
  public update(entities: IEntity[], _dt: number): void {
    entities
      .filter((e): e is ICharacterEntity => !!e.characterStateComp)
      .forEach((e: ICharacterEntity) => {
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
          this.moveX(physicsComp, walkSpeed, Direction.Left);
        } else if (pressed.right) {
          this.moveX(physicsComp, walkSpeed, Direction.Right);
        } else {
          this.moveX(physicsComp, 0, Direction.Right);
        }
      });
  }

  private moveX(physicsComp: IPhysicsComp, walkSpeed: number, direction: Direction) {
    if (direction === Direction.Left) {
      physicsComp.velocityX = -walkSpeed;
    } else if (direction === Direction.Right) {
      physicsComp.velocityX = walkSpeed;
    }
  }

  private jump(stateComp: ICharacterStateComp, physicsComp: IPhysicsComp, jumpSpeed: number) {
    if (!this.setState(stateComp, CharacterState.Jump)) {
      return;
    }
    physicsComp.velocityY = jumpSpeed;
    physicsComp.accelerationY = -2;
  }

  private endJump(
    stateComp: ICharacterStateComp,
    physicsComp: IPhysicsComp,
    positionComp: IPositionComp,
  ) {
    positionComp.y = 0; // Redundant if physics is working properly
    physicsComp.accelerationY = 0;
    physicsComp.velocityY = 0;
    this.setState(stateComp, CharacterState.Walk);
  }

  private setState(stateComp: ICharacterStateComp, targetState: CharacterState): boolean {
    if (this.canSetState(stateComp, targetState)) {
      stateComp.state = targetState;
      return true;
    }
    return false;
  }
  private canSetState(stateComp: ICharacterStateComp, targetState: CharacterState): boolean {
    if (targetState === CharacterState.Walk) {
      return [CharacterState.Jump].includes(stateComp.state);
    } else if (targetState === CharacterState.Jump) {
      return [CharacterState.Walk].includes(stateComp.state);
    }
    return false;
  }
}
