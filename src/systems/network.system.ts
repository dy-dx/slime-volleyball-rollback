import { CharacterSide, ICharacterInputComp, ICharacterStateComp } from '../components.js';
import { IEntity } from '../entities/entity.js';
import Game from '../game.js';
import Network, { MessageType } from '../network.js';
import ISystem from './system.js';

/* eslint-disable no-console */

const shallowCopy = <T>(o: T) => Object.assign({}, o);

interface ICharacterEntity extends IEntity {
  characterStateComp: ICharacterStateComp;
  inputComp: ICharacterInputComp;
}

interface IInputUpdate {
  inputComp: ICharacterInputComp;
  tick: number;
  isSpeculative: boolean;
}

interface IState {
  tick: number;
  entities: IEntity[];
}

export interface INetworkSystemDebugInfo {
  roundtripLatency: number;
  isConnectionReady: boolean;
  isSimulationReady: boolean;
  rollbackTicks: number;
  rollbackMs: number;
}

export default class NetworkSystem implements ISystem {
  public isConnectionReady: boolean;
  public isSimulationReady: boolean;
  public pingInterval = 240;
  private game: Game;
  private network: Network;
  // Network state that we don't care to put into an entity
  private roundtripLatency = -1;
  private lastRecordedRollbackTicks = 0;
  private lastRecordedRollbackMs = 0;
  private clientInputs: IInputUpdate[] = [];
  private remoteInputs: IInputUpdate[] = [];
  private states: IState[] = [];
  // private lastValidTick = -1;

  constructor(game: Game) {
    this.game = game;
    const urlParams = new URLSearchParams(window.location.search);
    this.network = new Network({
      onReadyCallback: this.onReady.bind(this),
      onCloseCallback: this.onClose.bind(this),
      onMessageCallback: this.onMessage.bind(this),
      clientId: urlParams.get('id'),
      peerId: urlParams.get('peerid'),
      localPort: parseInt(urlParams.get('localport') || '', 10),
    });
    // weird hack to make the game wait for "future" inputs
    // for (let i = 0; i < this.tickDelay; i++) {
    //   const fakeInputComp: ICharacterInputComp = {
    //     left: false,
    //     up: false,
    //     right: false,
    //   };
    //   this.clientInputs.push({ tick: i, inputComp: fakeInputComp });
    //   this.remoteInputs.push({ tick: i, inputComp: fakeInputComp });
    // }
    this.isConnectionReady = false;
    // Initialize to true so the player can do stuff while waiting for a connection
    // (we reset the simulation when the connection begins)
    this.isSimulationReady = true;
  }

  public debugInfo(): INetworkSystemDebugInfo {
    return {
      isSimulationReady: this.isSimulationReady,
      isConnectionReady: this.isConnectionReady,
      roundtripLatency: this.roundtripLatency,
      rollbackTicks: this.lastRecordedRollbackTicks,
      rollbackMs: this.lastRecordedRollbackMs,
    };
  }

  public update(entities: IEntity[], _dt: number): void {
    if (!this.isConnectionReady) {
      return;
    }
    // Stall the game simulation unless we've received the necessary inputs
    this.isSimulationReady = false;

    let clientCharacter: ICharacterEntity;
    let remoteCharacter: ICharacterEntity;
    const currentTick = this.game.getSimulationTick();
    const updateTick = this.game.getUpdateTick();

    if (updateTick % this.pingInterval === 0) {
      this.sendPing();
    }

    // save the last tick's state if we haven't already
    if (!this.states.find((s) => s.tick === currentTick - 1)) {
      const lastTickState = {
        tick: currentTick - 1,
        entities: this.game.getStateCopy(),
      };
      this.states.push(lastTickState);
    }

    entities
      .filter((e): e is ICharacterEntity => !!e.characterStateComp)
      .forEach((e: ICharacterEntity) => {
        if (e.isControlledByClient) {
          clientCharacter = e;
        } else {
          remoteCharacter = e;
        }
      });

    /*
    while (this.remoteInputs.length) {
      const { inputComp: nextInput, tick } = this.remoteInputs[0];

      if (tick < simulationTick) {
        this.remoteInputs.splice(0, 1);
        continue;
      }

      if (tick === simulationTick) {
        Object.assign(remoteCharacter!.inputComp, nextInput);
        this.isSimulationReady = true;
      }

      break;
    }

    for (let i = this.clientInputs.length - 1; i >= 0; i--) {
      const { tick } = this.clientInputs[i];

      if (tick < simulationTick) {
        this.clientInputs.splice(i, 1);
      }
    }

    const futureClientInput = this.clientInputs.find((e) => e.tick === futureInputTick);
    if (!futureClientInput) {
      const futureClientInputComp = Object.assign({}, clientCharacter!.inputComp);
      this.clientInputs.push({ inputComp: futureClientInputComp, tick: futureInputTick });
      this.sendInput(futureClientInputComp, futureInputTick);
    }

    const clientInput = this.clientInputs.find((e) => e.tick === simulationTick);
    if (this.isSimulationReady && clientInput) {
      Object.assign(clientCharacter!.inputComp, clientInput.inputComp);
    }
    */

    let remoteInput = this.remoteInputs.find((input) => input.tick === currentTick);
    if (remoteInput) {
      // We already have the remote input for this tick. We must be running behind, in an example of "one-sided rollback."
      // Oh well, sucks for the other player.
    } else {
      // console.log(`speculating remote input for tick ${simulationTick}`);
      const speculativeRemoteInputComp: ICharacterInputComp = this.remoteInputs.length
        ? shallowCopy(this.remoteInputs[this.remoteInputs.length - 1].inputComp)
        : {
            left: false,
            up: false,
            right: false,
          };
      remoteInput = {
        inputComp: speculativeRemoteInputComp,
        tick: currentTick,
        isSpeculative: true,
      };
      this.remoteInputs.push(remoteInput);
    }
    Object.assign(remoteCharacter!.inputComp, remoteInput.inputComp);
    this.isSimulationReady = true;

    // need to not do this when stalled or paused
    const clientInputComp = shallowCopy(clientCharacter!.inputComp);
    this.clientInputs.push({
      inputComp: clientInputComp,
      tick: currentTick,
      isSpeculative: false,
    });
    this.sendInput(clientInputComp, currentTick);

    // cleanup old data. don't need to do it right here but IDK where to put it.
    this.states = this.states.slice(-100);
    this.clientInputs = this.clientInputs.slice(-100);
    this.remoteInputs = this.remoteInputs.slice(-100);

    if (!this.isSimulationReady) {
      console.warn('No remote input available, increase the frame delay');
    }
  }

  private onReady() {
    this.isConnectionReady = true;
    this.game.resetSimulation();
    // fixme
    this.game.entities
      .filter((e): e is ICharacterEntity => !!e.characterStateComp)
      .forEach((e: ICharacterEntity) => {
        if (this.network.isHost) {
          e.isControlledByClient = e.characterStateComp.side === CharacterSide.P1;
        } else {
          e.isControlledByClient = e.characterStateComp.side === CharacterSide.P2;
        }
      });
    this.sendChat(`hello from ${this.network.clientId}`);
    this.sendPing();
  }

  private onClose() {
    this.isConnectionReady = false;
    this.states = [];
    this.clientInputs = [];
    this.remoteInputs = [];
    this.game.resetSimulation();
  }

  private onMessage(type: MessageType, data: unknown): void {
    if (type === MessageType.Ping) {
      this.onPing(data as number);
    } else if (type === MessageType.Pong) {
      this.onPong(data as number);
    } else if (type === MessageType.Chat) {
      this.onChat(data as string);
    } else if (type === MessageType.Input) {
      this.onInput(data as { inputComp: ICharacterInputComp; tick: number });
    } else {
      console.warn('Unhandled message type:', type, data);
    }
  }

  private onChat(s: string): void {
    console.log('Chat received:', s);
  }

  private onInput(data: { inputComp: ICharacterInputComp; tick: number }): void {
    if (!this.remoteInputs.length) {
      if (data.tick === 0) {
        // this is ok
        this.remoteInputs.push({ ...data, isSpeculative: false });
      } else {
        console.error(`we have no saved remoteInputs, but received one with tick=${data.tick}`);
      }
      return;
    }

    // find and override the speculative input we created for the given tick
    const existingSpeculativeInput = this.remoteInputs.find((input) => input.tick === data.tick);

    if (!existingSpeculativeInput) {
      const lastSpeculativeInput = this.remoteInputs[this.remoteInputs.length - 1];
      if (lastSpeculativeInput.tick === data.tick - 1) {
        // this is ok
        this.remoteInputs.push({ ...data, isSpeculative: false });
        this.lastRecordedRollbackTicks = 0;
      } else {
        console.error(`uhhh no speculative input for tick ${data.tick}. desync?`);
      }
      return;
    }

    const before = performance.now();
    existingSpeculativeInput.inputComp = data.inputComp;
    existingSpeculativeInput.isSpeculative = false;

    // roll back and roll forward if needed. assume, for now, that we won't get updates out-of-order.

    // because onInput() happens outside of the update call, this getSimulationTick() actually refers to the upcoming tick.
    const currentTick = this.game.getSimulationTick();

    // 1. get the game state of the tick before the one we just received inputs for
    const stateIndex = this.states.findIndex((s) => s.tick === data.tick - 1);
    const state = this.states[stateIndex];
    if (!state) {
      throw new Error(`no state recorded for tick ${data.tick - 1}`);
    }
    // clean up old states that we won't need anymore
    this.states = this.states.slice(stateIndex);

    // 2. loadState() and set this.game.simulationTick = data.tick + 1
    this.game.rollback(state.tick, state.entities);
    this.lastRecordedRollbackTicks = currentTick - data.tick;

    // 3. this.game.tick() until this.game.simulationTick === currentTick
    let clientCharacter: ICharacterEntity;
    let remoteCharacter: ICharacterEntity;
    this.game.entities
      .filter((e): e is ICharacterEntity => !!e.characterStateComp)
      .forEach((e: ICharacterEntity) => {
        if (e.isControlledByClient) {
          clientCharacter = e;
        } else {
          remoteCharacter = e;
        }
      });

    while (this.game.getSimulationTick() < currentTick) {
      const tick = this.game.getSimulationTick();
      const clientInputForTick = this.clientInputs.find((input) => input.tick === tick);
      const remoteInputForTick = this.remoteInputs.find((input) => input.tick === tick);
      Object.assign(clientCharacter!.inputComp, clientInputForTick!.inputComp);
      Object.assign(remoteCharacter!.inputComp, remoteInputForTick!.inputComp);
      this.game.tick(1);
      // overwrite saved state
      const stateCopy = this.game.getStateCopy();
      const prevSavedState = this.states.find((s) => s.tick === tick);
      if (prevSavedState) {
        prevSavedState.entities = stateCopy;
      } else {
        // we must not have saved it yet
        this.states.push({ tick, entities: stateCopy });
      }
    }
    this.lastRecordedRollbackMs = performance.now() - before;
  }

  private onPing(timestamp: number): void {
    this.network.send(MessageType.Pong, timestamp);
  }

  private onPong(timestamp: number): void {
    this.roundtripLatency = Date.now() - timestamp;
  }

  private sendChat(text: string): void {
    this.network.send(MessageType.Chat, text);
  }

  private sendInput(inputComp: ICharacterInputComp, tick: number): void {
    this.network.send(MessageType.Input, { inputComp, tick });
  }

  private sendPing(): void {
    this.network.send(MessageType.Ping, Date.now());
  }
}
