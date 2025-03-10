import Phaser from 'phaser'

export default class Background extends Phaser.Scene {
  constructor() {
    super('background')
  }

  create() {
    // Set a simple white background
    this.cameras.main.setBackgroundColor('#222639') // Plain white background
  }

  update(t: number, dt: number) {
    // Empty update method
  }
}
