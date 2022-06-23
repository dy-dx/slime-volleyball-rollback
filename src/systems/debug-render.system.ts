import { IAppearanceComp, IPositionComp } from '../components.js';
import { IEntity } from '../entities/entity.js';
import Game from '../game.js';
import ISystem from './system.js';

// not actually an "entity", this is just a hack
interface IUIEntity {
  appearanceComp: IAppearanceComp;
  positionComp: IPositionComp;
  element: HTMLElement;
  className: string;
}

export default class DebugRenderSystem implements ISystem {
  private gameElement: HTMLElement;
  private game: Game;

  private infoBox: IUIEntity;

  constructor(game: Game, elem: HTMLElement) {
    this.game = game;
    if (!elem) {
      throw new Error();
    }
    this.gameElement = elem;

    const infoBoxAppearanceComp = {
      width: 180,
      height: 60,
      zIndex: 10000,
    };
    this.infoBox = {
      appearanceComp: infoBoxAppearanceComp,
      positionComp: {
        x: this.game.width / 2 - infoBoxAppearanceComp.width / 2,
        y: this.game.height - infoBoxAppearanceComp.height,
      },
      element: document.createElement('div'),
      className: 'ui-debug',
    };

    [this.infoBox].forEach((e) => this.setupElement(e));
  }

  public update(_entities: IEntity[], _dt: number): void {
    const networkInfo = this.game.networkSystem.debugInfo();

    const networkText = !networkInfo.isConnectionReady
      ? 'Waiting for connection'
      : `ping: ${Math.ceil(networkInfo.roundtripLatency / 2)}ms`;

    this.infoBox.element.textContent = [
      networkText,
      `rollback: ${networkInfo.rollbackTicks} | ${networkInfo.rollbackMs.toFixed(1)}ms`,
      `update: ${this.game.approximateAvgUpdateMs.toFixed(1)}ms`,
      `render: ${this.game.approximateAvgRenderMs.toFixed(1)}ms`,
    ].join('\n');
  }

  private setupElement(e: IUIEntity) {
    e.element.className = `entity ${e.className}`;
    this.setStyles(e.element, e.appearanceComp, e.positionComp);
    this.gameElement.appendChild(e.element);
  }

  private setStyles(
    elem: HTMLElement,
    appearanceComp: IAppearanceComp,
    positionComp: IPositionComp,
  ): void {
    elem.style.transform = `translate3d(${positionComp.x}px,${-positionComp.y}px,0px)`;
    elem.style.width = `${appearanceComp.width}px`;
    elem.style.height = `${appearanceComp.height}px`;
    elem.style.zIndex = `${appearanceComp.zIndex}`;
  }
}
