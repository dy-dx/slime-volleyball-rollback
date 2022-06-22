import { IDebugInputComp, DebugInputAction } from '../components.js';
import { IEntity } from '../entities/entity.js';
import Game from '../game.js';
import deepClone from '../util/deep-clone.js';
import { MAPPING } from './input.system.js';
import ISystem from './system.js';

// this has its own input listeners to avoid kludging another InputComponent somewhere
// and we only listen on keyup here to make things easier

export default class DebugSystem implements ISystem {
  private game: Game;
  private released: IDebugInputComp;
  private savedEntityState?: IEntity[];

  constructor(game: Game, document: Document) {
    this.game = game;

    this.released = {
      pause: false,
      reset: false,
      nextFrame: false,
      saveState: false,
      loadState: false,
    };

    document.addEventListener('keyup', this.releaseKey.bind(this));
  }

  public update(_entities: IEntity[], _dt: number): void {
    if (!this.game.areDebugControlsAllowed()) {
      return;
    }

    const released = this.released;

    if (released.pause) {
      this.game.togglePause();
    } else if (released.reset) {
      this.game.resetSimulation();
    } else if (released.nextFrame) {
      this.game.advanceFrame();
    } else if (released.saveState) {
      this.savedEntityState = this.game.getStateCopy();
    } else if (released.loadState) {
      if (this.savedEntityState) {
        this.game.loadState(deepClone(this.savedEntityState));
      }
    } else {
      return;
    }

    // reset inputs because we only listen on keyup
    for (const k in released) {
      released[k as DebugInputAction] = false;
    }
  }

  private releaseKey(evt: KeyboardEvent): void {
    if (evt.ctrlKey || evt.metaKey) {
      return;
    }
    const action = MAPPING[evt.code];
    if (!action) {
      return;
    }
    evt.preventDefault();
    this.released[action as DebugInputAction] = true;
  }
}
