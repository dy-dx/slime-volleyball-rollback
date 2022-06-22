import { IAppearanceComp, IPhysicsComp, IPositionComp } from '../components.js';
import { IEntity } from '../entities/entity.js';

export default class Ball implements IEntity {
  public id: number = 0;
  public appearanceComp: IAppearanceComp;
  public physicsComp!: IPhysicsComp;
  public positionComp!: IPositionComp;

  public isBall: boolean;

  static initialY = 356;

  // For easy state saving/loading, no instance methods allowed on entities!
  static reset(ball: Ball, x: number = 0, y: number = 0) {
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

  constructor(x: number = 0, y: number = 0, color = '#ff0') {
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
}
