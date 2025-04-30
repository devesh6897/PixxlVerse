import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { currentstate } from '../../../types/state'

type Payload = {
  client: Client
  props: { [key: string]: any }
}

export default class PlayerUpdatePropsCommand extends Command<currentstate, Payload> {
  execute(data: Payload) {
    const { client, props } = data

    const player = this.room.state.players.get(client.sessionId)
    if (!player) return
    
    // Update each property in the payload
    Object.keys(props).forEach(key => {
      // Only update valid properties we want to allow clients to change
      if (key === 'audioEnabled' || key === 'videoEnabled') {
        player[key] = props[key];
      }
    });
  }
} 