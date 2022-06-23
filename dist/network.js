export default class Network {
    constructor({ onMessageCallback, onReadyCallback, onCloseCallback, clientId, peerId, localPort, }) {
        this.onMessageCallback = onMessageCallback;
        this.onReadyCallback = onReadyCallback;
        this.onCloseCallback = onCloseCallback;
        this.clientId = clientId || `df-${Math.random().toString(36).substring(2, 9)}`;
        this.peerId = peerId || null;
        this.isHost = !this.peerId;
        const peerOpts = {
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
                this.connection = this.peer.connect(this.peerId, { reliable: false });
                this.connection.once('close', this.onClose.bind(this));
                this.connection.once('open', this.onOpen.bind(this));
            });
        }
        else {
            this.peer.on('connection', (conn) => {
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
    send(type, data) {
        this.connection?.send({ type, data });
    }
    onOpen() {
        this.connection.on('data', this.onMessage.bind(this));
        this.onReadyCallback();
    }
    onClose() {
        this.connection = null;
        console.warn('closed connection');
        this.onCloseCallback();
    }
    onMessage(msg) {
        if (msg.type == null) {
            console.warn('Malformed network message', msg);
            return;
        }
        const { type, data } = msg;
        try {
            this.onMessageCallback(type, data);
        }
        catch (e) {
            // this.peer?.disconnect();
            this.connection?.close();
            console.error(e);
        }
    }
}
//# sourceMappingURL=network.js.map