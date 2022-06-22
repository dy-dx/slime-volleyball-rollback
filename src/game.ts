import { CharacterSide } from './components.js';
import Ball from './entities/ball.js';
import Character from './entities/character.js';
import Level from './entities/level.js';
import { IEntity } from './entities/entity.js';
import CharacterStateSystem from './systems/character-state.system.js';
import DebugRenderSystem from './systems/debug-render.system.js';
import DebugSystem from './systems/debug.system.js';
import InputSystem from './systems/input.system.js';
import NetworkSystem from './systems/network.system.js';
import PhysicsSystem from './systems/physics.system.js';
import ScoreSystem from './systems/score.system.js';
import RenderSystem from './systems/render.system.js';
import ISystem from './systems/system.js';
import deepClone from './util/deep-clone.js';

export default class Game {
  public readonly height: number;
  public readonly width: number;
  public readonly gameHeight: number;
  public readonly gameWidth: number;
  public readonly networkSystem: NetworkSystem;
  public approximateAvgRenderMs = 0;
  public approximateAvgUpdateMs = 0;
  private simulationTick = 0;
  private updateTick = 0; // increases even when simulation is paused
  private isPaused = false;
  private entities: IEntity[] = [];
  private inputSystems: ISystem[];
  private simulationSystems: ISystem[];
  private renderSystems: ISystem[];

  constructor(elem: HTMLElement, width: number, height: number) {
    this.gameWidth = 1000;
    this.gameHeight = 1000;
    this.width = width;
    this.height = height;
    elem.style.width = `${width}px`;
    elem.style.height = `${height}px`;

    this.resetSimulation();

    this.networkSystem = new NetworkSystem(this);
    this.inputSystems = [
      // prettier-ignore
      new InputSystem(document),
      this.networkSystem,
      new DebugSystem(this, document),
    ];
    this.simulationSystems = [
      new CharacterStateSystem(),
      new PhysicsSystem(),
      new ScoreSystem(this),
    ];
    this.renderSystems = [
      // prettier-ignore
      new RenderSystem(this, elem),
      new DebugRenderSystem(this, elem),
    ];
  }

  public getSimulationTick(): number {
    return this.simulationTick;
  }

  public getUpdateTick(): number {
    return this.updateTick;
  }

  public getP1(): Character {
    // pretty dumb but it'll work for now
    return this.entities[0] as Character;
  }

  public getP2(): Character {
    // pretty dumb but it'll work for now
    return this.entities[1] as Character;
  }

  public getBall(): Ball {
    // pretty dumb but it'll work for now
    return this.entities[2] as Ball;
  }

  public areDebugControlsAllowed(): boolean {
    return !this.networkSystem.isConnectionReady;
  }

  public initRound(side: CharacterSide): void {
    const p1 = this.getP1();
    const p2 = this.getP2();
    Character.reset(p1);
    Character.reset(p2);
    const ball = this.getBall();
    Ball.reset(ball, side === CharacterSide.P1 ? p1.positionComp.x : p2.positionComp.x);
  }

  public resetSimulation(): void {
    this.isPaused = false;
    this.simulationTick = 0;
    this.entities = [];
    const p1 = new Character(CharacterSide.P1);
    p1.isControlledByClient = true;
    const p2 = new Character(CharacterSide.P2);
    const ball = new Ball();
    const level = new Level(7);

    this.entities.push(p1);
    this.entities.push(p2);
    this.entities.push(ball);
    this.entities.push(level);
    // fixme, terrible hack
    this.entities.forEach((e, i) => (e.id = i));
    this.initRound(CharacterSide.P1);
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  public update(dt: number): void {
    const t0 = performance.now();
    this.inputSystems.forEach((s) => {
      s.update(this.entities, dt);
    });
    if (!this.isPaused && this.networkSystem.isSimulationReady) {
      this.tick(dt);
    }
    this.updateTick++;
    this.approximateAvgUpdateMs += (performance.now() - t0 - this.approximateAvgUpdateMs) / 60;
  }

  public render(dt: number): void {
    const t0 = performance.now();
    this.renderSystems.forEach((s) => {
      s.update(this.entities, dt);
    });
    this.approximateAvgRenderMs += (performance.now() - t0 - this.approximateAvgRenderMs) / 60;
  }

  public advanceFrame(): void {
    if (!this.isPaused) {
      return;
    }
    this.tick(1);
  }

  public getStateCopy(): IEntity[] {
    return deepClone(this.entities);
  }

  public loadState(entities: IEntity[]): void {
    this.entities = entities;
  }

  private tick(dt: number): void {
    this.simulationSystems.forEach((s) => {
      s.update(this.entities, dt);
    });

    this.simulationTick++;
  }
}
