import { IScoreComp } from '../components.js';
import { IEntity } from '../entities/entity.js';

export default class Level implements IEntity {
  public id: number = 0;
  public scoreComp: IScoreComp;

  // For easy state saving/loading, no instance methods allowed on entities!
  static reset(level: Level) {
    level.scoreComp.p1Points = 0;
    level.scoreComp.p2Points = 0;
  }

  constructor(maxPoints: number = 7) {
    this.scoreComp = {
      p1Points: 0,
      p2Points: 0,
      maxPoints,
    };
  }
}
