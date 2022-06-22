// Web browsers need exact paths for imports, but typescript fails to load types for PeerJS this way
// import "../../node_modules/peerjs/dist/peerjs.min.js";

// ^ That used to work until peerjs switched to parcel. Now we're just loading the script in index.html.

declare global {
  interface Window {
    Peer: typeof Peer.Peer;
  }
}

/**
 * This is a hack that imports peerjs types without actually importing the library.
 * See: https://github.com/basarat/typescript-book/blob/master/docs/project/external-modules.md
 *
 * The next line doesn't get emitted to the JS output, because of this error:
 * "TS1202: Import assignment cannot be used when targeting ECMAScript modules."
 *
 * The other method I found was this, but it's so annoying:
 * declare var Peer: typeof import ("peerjs");
 * declare type Peer = import ("peerjs");
 * declare type DataConnection = import ("peerjs").DataConnection;
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Peer = require('peerjs');

export default Peer;
