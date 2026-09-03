// Browser copy of the wire protocol constants.
// KEEP IN SYNC with server/protocol.js
window.EVENTS = {
  // Client -> Server
  C2S: {
    JOIN: 'join',
    REJOIN: 'rejoin',
    PLAYER_ACTION: 'player_action',
    HOST_HELLO: 'host_hello',
    HOST_START_MODE: 'host_start_mode',
    HOST_ACTION: 'host_action',
  },
  // Server -> Client
  S2C: {
    JOINED: 'joined',
    ERROR: 'error',
    LOBBY_STATE: 'lobby_state',
    MODE_STARTED: 'mode_started',
    MODE_STATE: 'mode_state',
    MODE_ENDED: 'mode_ended',
  },
};
