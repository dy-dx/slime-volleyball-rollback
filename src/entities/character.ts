import {
  CharacterSide,
  CharacterState,
  IAppearanceComp,
  ICharacterDefinitionComp,
  ICharacterInputComp,
  ICharacterStateComp,
  IPhysicsComp,
  IPositionComp,
} from '../components.js';
import { IEntity } from '../entities/entity.js';

export default class Character implements IEntity {
  public id: number = 0;
  public appearanceComp: IAppearanceComp;
  public characterDefinitionComp: ICharacterDefinitionComp;
  public characterStateComp: ICharacterStateComp;
  public inputComp: ICharacterInputComp;
  public physicsComp!: IPhysicsComp;
  public positionComp!: IPositionComp;

  public isControlledByClient: boolean;

  // For easy state saving/loading, no instance methods allowed on entities!
  static reset(char: Character, x: number = 0) {
    const side = char.characterStateComp.side;
    const defaultX = side === CharacterSide.P1 ? 200 : 800;

    char.characterStateComp.state = CharacterState.Walk;

    // from the original engine
    const wallDist = 50;
    const netDist = 55;
    const p1Range = { minX: wallDist, maxX: 500 - netDist };
    const p2Range = { minX: 500 + netDist, maxX: 1000 - wallDist };

    char.positionComp = {
      x: x || defaultX,
      y: 0,
      ...(char.characterStateComp.side === CharacterSide.P1 ? p1Range : p2Range),
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

  constructor(side: CharacterSide, x: number = 0, color = '#0f0') {
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
}
