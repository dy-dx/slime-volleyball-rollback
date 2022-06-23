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
  private clientInputs: IInputUpdate[] = [];
  private remoteInputs: IInputUpdate[] = [];
  private states: IState[] = [];
  // private lastValidTick = -1;

  constructor(game: Game) {
    this.game = game;
    const urlParams = new URLSearchParams(window.location.search);
    this.network = new Network({
      onReadyCallback: this.onReady.bind(this),
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

    const lastTickState = {
      tick: currentTick - 1,
      entities: this.game.getStateCopy(),
    };
    this.states.push(lastTickState);

    entities
      .filter((e): e is ICharacterEntity => !!e.characterStateComp)
      .forEach((e: ICharacterEntity) => {
        if (this.network.isHost) {
          e.isControlledByClient = e.characterStateComp.side === CharacterSide.P1;
        } else {
          e.isControlledByClient = e.characterStateComp.side === CharacterSide.P2;
        }

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

    if (!this.isSimulationReady) {
      console.warn('No remote input available, increase the frame delay');
    }
  }

  private onReady() {
    this.isConnectionReady = true;
    this.game.resetSimulation();
    this.sendChat(`hello from ${this.network.clientId}`);
    this.sendPing();
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
        console.log('uhhh oh no no no');
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
        console.log('uhhh oh no');
      }
      return;
    }

    existingSpeculativeInput.inputComp = data.inputComp;
    existingSpeculativeInput.isSpeculative = false;

    // roll back and roll forward if needed. assume, for now, that we won't get updates out-of-order.

    // because onInput() happens outside of the update call, this getSimulationTick() actually refers to the upcoming tick.
    const currentTick = this.game.getSimulationTick();

    // 1. get the game state of the tick before the one we just received inputs for
    const stateIndex = this.states.findIndex((s) => s.tick === data.tick - 1);
    const state = this.states[stateIndex];
    // clean up old states that we won't need anymore
    this.states = this.states.slice(stateIndex);

    // 2. loadState() and set this.game.simulationTick = data.tick + 1
    if (state) {
      this.game.rollback(state.tick, state.entities);
      this.lastRecordedRollbackTicks = currentTick - data.tick;
    } else {
      throw new Error(`uh oh no state recorded for tick ${data.tick - 1}`);
    }

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
      const clientInputForTick = this.clientInputs.find(
        (input) => input.tick === this.game.getSimulationTick(),
      );
      const remoteInputForTick = this.remoteInputs.find(
        (input) => input.tick === this.game.getSimulationTick(),
      );
      Object.assign(clientCharacter!.inputComp, clientInputForTick!.inputComp);
      Object.assign(remoteCharacter!.inputComp, remoteInputForTick!.inputComp);
      this.game.tick(1);
    }
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
