import { IScoreComp, IPhysicsComp, IPositionComp, CharacterSide } from '../components.js';
import { IEntity } from '../entities/entity.js';
import ISystem from './system.js';
import Game from '../game.js';

interface IScoreEntity extends IEntity {
  scoreComp: IScoreComp;
}

interface IPhysicsEntity extends IEntity {
  physicsComp: IPhysicsComp;
  positionComp: IPositionComp;
}

export default class ScoreSystem implements ISystem {
  private readonly game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  public update(entities: IEntity[]): void {
    const level = entities.find((e): e is IScoreEntity => !!e.scoreComp);
    if (!level) {
      return;
    }
    const physicsEntities = entities.filter((e): e is IPhysicsEntity => !!e.physicsComp);
    const ball = physicsEntities.find((e) => e.isBall);
    // Check for end of round
    if (ball && ball.positionComp.y <= 0) {
      if (ball.positionComp.x > 500) {
        level.scoreComp.p1Points += 1;
        this.game.initRound(CharacterSide.P1);
      } else {
        level.scoreComp.p2Points += 1;
        this.game.initRound(CharacterSide.P2);
      }
    }
  }
}
