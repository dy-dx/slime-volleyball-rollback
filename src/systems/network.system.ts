import { CharacterSide, ICharacterInputComp, ICharacterStateComp } from '../components.js';
import { IEntity } from '../entities/entity.js';
import Game from '../game.js';
import Network, { MessageType } from '../network.js';
import ISystem from './system.js';

/* eslint-disable no-console */

interface ICharacterEntity extends IEntity {
  characterStateComp: ICharacterStateComp;
  inputComp: ICharacterInputComp;
}

interface IInputUpdate {
  inputComp: ICharacterInputComp;
  tick: number;
}

export interface INetworkSystemDebugInfo {
  tickDelay: number;
  roundtripLatency: number;
  isConnectionReady: boolean;
  isSimulationReady: boolean;
}

export default class NetworkSystem implements ISystem {
  public isConnectionReady: boolean;
  public isSimulationReady: boolean;
  public pingInterval = 240;
  private game: Game;
  private network: Network;
  // Network state that we don't care to put into an entity
  private roundtripLatency: number;
  private tickDelay: number;
  private clientInputs: IInputUpdate[];
  private remoteInputs: IInputUpdate[];

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
    this.roundtripLatency = -1;
    this.tickDelay = 4;
    this.clientInputs = [];
    this.remoteInputs = [];
    // weird hack to make the game wait for "future" inputs
    for (let i = 0; i < this.tickDelay; i++) {
      const fakeInputComp: ICharacterInputComp = {
        left: false,
        up: false,
        right: false,
      };
      this.clientInputs.push({ tick: i, inputComp: fakeInputComp });
      this.remoteInputs.push({ tick: i, inputComp: fakeInputComp });
    }
    this.isConnectionReady = false;
    // Initialize to true so the player can do stuff while waiting for a connection
    // (we reset the simulation when the connection begins)
    this.isSimulationReady = true;
  }

  public debugInfo(): INetworkSystemDebugInfo {
    return {
      isSimulationReady: this.isSimulationReady,
      isConnectionReady: this.isConnectionReady,
      tickDelay: this.tickDelay,
      roundtripLatency: this.roundtripLatency,
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
    const simulationTick = this.game.getSimulationTick();
    const updateTick = this.game.getUpdateTick();
    const futureInputTick = simulationTick + this.tickDelay;

    if (updateTick % this.pingInterval === 0) {
      this.sendPing();
    }

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
    this.remoteInputs.push(data);
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
