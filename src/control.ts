import { IMediaParams } from './interfaces'
import { Util } from './util'

export class Control {
  private util: Util

  private api_key: string
  private peer_id: string
  private recv_addr = "127.0.0.1"
  private video_recv_port = 20000
  private audio_recv_port = 20001
  private video_rtcp_recv_port = 20010
  private audio_rtcp_recv_port = 20011
  
  private video_params: IMediaParams
  private audio_params: IMediaParams | null
  private video_rtcp_params: IMediaParams | null
  private audio_rtcp_params: IMediaParams | null
  private peer_token: string | null = null
  private isLoop = true

  constructor() {
    this.api_key = !!process.env.API_KEY? process.env.API_KEY: ""
    this.util = new Util()
    this.peer_id = "SSG_" + (!!this.util.getSerialNUmber()? this.util.getSerialNUmber(): "jetson-nano")
    this.video_params = {
      ip_v4: this.recv_addr,
      port: this.video_recv_port
    }
    this.audio_params = null
    this.video_rtcp_params = {
      ip_v4: this.recv_addr,
      port: this.video_rtcp_recv_port
    }
    this.audio_rtcp_params = null
  }

  public async start() {
    try {
      this.peer_token = await this.util.createPeer(this.api_key, this.peer_id)
    } catch(e) {
      console.error(e)
      this.exit()
    }
    if (!this.peer_token) {
      this.exit()
      return
    }
    do {
      try {
        const media_connection_id = await this.util.waitMedia(this.peer_id, this.peer_token)
        if (!!media_connection_id) {
          await this.util.media(
            media_connection_id,
            this.video_params,
            this.audio_params,
            this.video_rtcp_params,
            this.audio_rtcp_params)
        }
      } catch (e) {
        console.error(e)
        this.exit()
      }
    } while (this.isLoop)
  }

  public async exit() {
    this.isLoop = false
    await this.util.exit()
    if (!!this.peer_token) {
      try {
        await this.util.deletePeer(this.peer_id, this.peer_token)
      } catch (e) {
        console.error("deletePeer error:", e)
      }
    }
  }
}