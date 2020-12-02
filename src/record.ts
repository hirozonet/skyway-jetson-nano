import dayjs from 'dayjs'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { check, DiskUsage } from 'diskusage'
import { Util } from './util'
import { ChildProcess } from 'child_process'

export class Record {
  private util: Util
  private port: number = 5001
  private recProc: ChildProcess | null = null
  private startRecTime: dayjs.Dayjs | null = null
  private path: string | null = null
  private isLoop = true
  private readdirAsync = util.promisify(fs.readdir)
  private statAsync = util.promisify(fs.stat)

  constructor() {
    this.util = new Util()
  }

  public async start() {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const timeup = 600000
    const availThreshold = 30
    const recPath = "./record/loop/"
    fs.mkdirSync(recPath, {recursive: true})
    do {
      const now = dayjs()
      const diff = !!this.startRecTime ? now.diff(this.startRecTime) : -1
      if (diff == -1 || diff > timeup) {
        if (diff >= timeup && !!this.recProc && !!this.path) {
          this.util.killGstreamRec(this.recProc, this.path)
          this.port = this.port == 5001 ? 5002 : 5001
        }
        this.startRecTime = now
        const recFile = this.startRecTime.format("YYYYMMDDHHmmss") + ".mp4"
        this.path = path.join(recPath, recFile)
        this.recProc = this.util.execGstreamRec(this.port, this.path)
      }
      check('/', async (error?: Error, result?: DiskUsage) => {
        if (!!error) { console.log(error) }
        else if (!!result) {
          const percentAvailable = ((result.available / result.total) * 100)
          if (percentAvailable < availThreshold) {
            const recFilesSort = await this.readdirChronoSorted(recPath, -1)
            if (recFilesSort.length > 1) {
              fs.unlinkSync(path.join(recPath, recFilesSort[0]))
            }
          }
        }
      })
      await new Promise(resolve => setTimeout(resolve, 1000))
    } while (this.isLoop)
  }

  public exit() {
    this.isLoop = false
    !!this.recProc && !!this.path && this.util.killGstreamRec(this.recProc, this.path)
  }

  private async readdirChronoSorted(dirpath: string, order: number) {
    order = order || 1
    const files = await this.readdirAsync(dirpath)
    const stats = await Promise.all(
      files.map((filename) =>
        this.statAsync(path.join(dirpath, filename))
          .then((stat) => ({ filename, stat }))
      )
    )
    return stats.sort((a, b) =>
      order * (b.stat.mtime.getTime() - a.stat.mtime.getTime()))
      .map((stat) => stat.filename)
  }
}