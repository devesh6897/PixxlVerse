import Phaser from 'phaser'
import { BackgroundMode } from '../../../types/BackgroundMode'

export default class Background extends Phaser.Scene {
  constructor() {
    super('background')
  }

  create(data: { backgroundMode: BackgroundMode }) {
    const sceneHeight = this.cameras.main.height
    const sceneWidth = this.cameras.main.width

    // Set white background
    this.cameras.main.setBackgroundColor('#222639')
  }

  update(t: number, dt: number) {
    // No update needed for static background
  }
}
