import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { currentstate } from '../../../types/state'

type Payload = {
  client: Client
  computerId: string
}

export class ComputerAddUserCommand extends Command<currentstate, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.room.state.computers.get(computerId)
    const clientId = client.sessionId

    if (!computer || computer.connectedUser.has(clientId)) return
    computer.connectedUser.add(clientId)
  }
}

export class ComputerRemoveUserCommand extends Command<currentstate, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.state.computers.get(computerId)

    if (computer.connectedUser.has(client.sessionId)) {
      computer.connectedUser.delete(client.sessionId)
    }
  }
}
