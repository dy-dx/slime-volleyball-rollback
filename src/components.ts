export interface IScoreComp {
  p1Points: number;
  p2Points: number;
  maxPoints: number;
  freezeTime: number;
}

export interface IAppearanceComp {
  width: number;
  height: number;
  zIndex: number;
  color?: string;
}

export interface IPositionComp {
  x: number;
  y: number;
  // for slime character movement rules
  minX?: number;
  maxX?: number;
}

export type CharacterInputAction = 'left' | 'up' | 'right';
export type DebugInputAction = 'pause' | 'reset' | 'nextFrame' | 'saveState' | 'loadState';
export type InputAction = CharacterInputAction | DebugInputAction;

export type ICharacterInputComp = {
  [K in CharacterInputAction]: boolean;
};

export type IDebugInputComp = {
  [K in DebugInputAction]: boolean;
};

export type IInputComp = {
  [K in InputAction]: boolean;
};

export interface IPhysicsComp {
  isMoveable: boolean;
  velocityX: number;
  velocityY: number;
  accelerationY: number;
  maxSpeedX: number;
  maxSpeedY: number;
  radius: number;
}

export interface ICharacterDefinitionComp {
  name: string;
  walkSpeed: number;
  jumpSpeed: number;
}

export enum CharacterState {
  Walk,
  Jump,
}

export const enum CharacterSide {
  P1,
  P2,
}

export interface ICharacterStateComp {
  state: CharacterState;
  side: CharacterSide;
}
