import { ItemType } from '../../../types/Items'
import Item from './Item'
import { phaserEvents, Event } from '../events/EventCenter'

export default class PoolTable extends Item {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame)

    this.itemType = ItemType.POOLTABLE
  }

  onOverlapDialog() {
    this.setDialogBox('Press E to play games')
  }
} 