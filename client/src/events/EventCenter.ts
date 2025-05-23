import Phaser from 'phaser'

export const phaserEvents = new Phaser.Events.EventEmitter()

export enum Event {
  PLAYER_JOINED = 'player-joined',
  PLAYER_UPDATED = 'player-updated',
  PLAYER_LEFT = 'player-left',
  PLAYER_DISCONNECTED = 'player-disconnected',
  MY_PLAYER_READY = 'my-player-ready',
  MY_PLAYER_NAME_CHANGE = 'my-player-name-change',
  MY_PLAYER_TEXTURE_CHANGE = 'my-player-texture-change',
  MY_PLAYER_VIDEO_CONNECTED = 'my-player-video-connected',
  ITEM_USER_ADDED = 'item-user-added',
  ITEM_USER_REMOVED = 'item-user-removed',
  UPDATE_DIALOG_BUBBLE = 'update-dialog-bubble',
  PLAYER_VIDEO_STATE_CHANGED = 'player-video-state-changed',
  PLAYER_AUDIO_STATE_CHANGED = 'player-audio-state-changed',
  
  // Layout events for video display
  SCREEN_SHARING_STARTED = 'screen_sharing_started',
  SCREEN_SHARING_STOPPED = 'screen_sharing_stopped',
  WHITEBOARD_ACTIVATED = 'whiteboard_activated',
  WHITEBOARD_DEACTIVATED = 'whiteboard_deactivated',
  GAME_STARTED = 'game_started',
  GAME_STOPPED = 'game_stopped',
}
