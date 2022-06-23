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
  Start,
}

type OnMessageCallback = (type: MessageType, data: any) => void;
type VoidCallback = () => void;
interface IConstructorParams {
  onReadyCallback: VoidCallback;
  onCloseCallback: VoidCallback;
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
  private onReadyCallback: VoidCallback;
  private onCloseCallback: VoidCallback;

  constructor({
    onMessageCallback,
    onReadyCallback,
    onCloseCallback,
    clientId,
    peerId,
    localPort,
  }: IConstructorParams) {
    this.onMessageCallback = onMessageCallback;
    this.onReadyCallback = onReadyCallback;
    this.onCloseCallback = onCloseCallback;

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
      this.peer.once('open', () => {
        this.connection = this.peer.connect(this.peerId!, { reliable: false });
        this.connection.once('close', this.onClose.bind(this));
        this.connection.once('open', this.onOpen.bind(this));
      });
    } else {
      this.peer.on('connection', (conn: Peer.DataConnection) => {
        if (this.connection) {
          // we already got one buddy
          return;
        }
        this.connection = conn;
        this.peerId = conn.peer;
        this.connection.once('open', this.onOpen.bind(this));
        this.connection.once('close', this.onClose.bind(this));
      });
    }
  }

  public send(type: MessageType, data: unknown): void {
    this.connection?.send({ type, data });
  }

  private onOpen(): void {
    this.connection!.on('data', this.onMessage.bind(this));
    this.onReadyCallback();
  }

  private onClose(): void {
    this.connection = null;
    console.warn('closed connection');
    this.onCloseCallback();
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
      // this.peer?.disconnect();
      this.connection?.close();
      console.error(e);
    }
  }
}
