import {
  IAppearanceComp,
  ICharacterInputComp,
  ICharacterStateComp,
  IInputComp,
  IPhysicsComp,
  IPositionComp,
  IScoreComp,
} from '../components.js';

export interface IEntity {
  id: number;

  appearanceComp?: IAppearanceComp;
  characterStateComp?: ICharacterStateComp;
  inputComp?: ICharacterInputComp | IInputComp;
  physicsComp?: IPhysicsComp;
  positionComp?: IPositionComp;
  scoreComp?: IScoreComp;

  isControlledByClient?: boolean;
  isBall?: boolean;
}
