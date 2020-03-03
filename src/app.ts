import { Control } from './control'
import { Util } from './util'

class App {
  private control: Control
  private util: Util
  private isSIGINT = false

  constructor() {
    this.control = new Control()
    this.util = new Util()
  }

  public async start() {
    this.util.startDocker()
    await this.control.start()
    if (!this.isSIGINT) {
      this.exit()
    }
  }

  public setHandler() {
    process.on('SIGINT', (signal) => {
      if (!this.isSIGINT) {
        this.isSIGINT = true
        console.log("ctrl+c signal:", signal)
        this.exit()
      }
    })
  }

  private async exit() {
    await this.control.exit()
    this.util.stopDocker()
    process.exit();
  }
}

const app = new App()
app.setHandler()
app.start()