import { Control } from './control'
import { Record } from './record'
import { Util } from './util'
import { ChildProcess } from 'child_process'

class App {
  private control: Control
  private record: Record
  private util: Util
  private isSIGINT = false
  private gstLaunch: ChildProcess | null = null
  private is_record: boolean = false

  constructor() {
    this.control = new Control()
    this.record = new Record()
    this.util = new Util()
    this.is_record = !!process.env.IS_RECORD ? process.env.IS_RECORD === "true" : false
  }

  public async start() {
    this.gstLaunch = this.util.execGstreamLaunch()
    this.util.startDocker()
    this.is_record && this.record.start()
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
    this.record.exit()
    !!this.gstLaunch && this.util.killGstreamLaunch(this.gstLaunch)
    await this.control.exit()
    this.util.stopDocker()
    process.exit();
  }
}

const app = new App()
app.setHandler()
app.start()