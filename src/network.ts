import Peer from './util/peer-wrapper.js';

// fixme
/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

export const enum MessageType {
  Input,
  InputAck,
  Ping,
  Pong,
  Chat,
}

type OnMessageCallback = (type: MessageType, data: any) => void;
type OnReadyCallback = () => void;
interface IConstructorParams {
  onReadyCallback: OnReadyCallback;
  onMessageCallback: OnMessageCallback;
  clientId: string | null;
  peerId: string | null;
  localPort: number | null;
}

export default class Network {
  public clientId: string;
  public peerId: string | null;
  public isHost: boolean;
  private peer: Peer.Peer;
  private connection: Peer.DataConnection | null;
  private onMessageCallback: OnMessageCallback;
  private onReadyCallback: OnReadyCallback;

  constructor({
    onMessageCallback,
    onReadyCallback,
    clientId,
    peerId,
    localPort,
  }: IConstructorParams) {
    this.onMessageCallback = onMessageCallback;
    this.onReadyCallback = onReadyCallback;

    this.clientId = clientId || `df-${Math.random().toString(36).substring(2, 9)}`;
    this.peerId = peerId || null;
    this.isHost = !this.peerId;

    const peerOpts: Peer.PeerJSOption = {
      debug: 2,
    };
    if (localPort) {
      Object.assign(peerOpts, {
        host: 'localhost',
        port: localPort,
        config: { iceServers: [{ url: 'stun:localhost:3478' }] },
      });
    }

    this.connection = null;
    this.peer = new window.Peer(this.clientId, peerOpts);

    if (this.peerId) {
      // Despite what the docs say, there are issues when trying to connect before the "open" event
      this.peer.on('open', () => {
        this.connection = this.peer.connect(this.peerId!, { reliable: false });
        this.connection.on('open', this.onOpen.bind(this));
      });
    } else {
      this.peer.on('connection', (conn: Peer.DataConnection) => {
        this.connection = conn;
        this.peerId = conn.peer;
        this.connection.on('open', this.onOpen.bind(this));
      });
    }
  }

  public send(type: MessageType, data: unknown): void {
    this.connection!.send({ type, data });
  }

  private onOpen(): void {
    this.connection!.on('data', this.onMessage.bind(this));
    this.onReadyCallback();
  }

  private onMessage(msg: any): void {
    if (msg.type == null) {
      console.warn('Malformed network message', msg);
      return;
    }
    const { type, data }: { type: MessageType; data: any } = msg;

    try {
      this.onMessageCallback(type, data);
    } catch (e) {
      this.peer?.disconnect();
      this.connection?.close();
      throw e;
    }
  }
}
