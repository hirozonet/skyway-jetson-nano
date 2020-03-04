import * as request from 'request-promise-native'
import * as fs from 'fs'
import { throws } from 'assert'
import { ChildProcess, spawn, exec, execSync } from 'child_process'
import {
  IPeersCreate,
  IMediaCreate,
  IEventRes,
  IEventsPeer,
  IEventsStream,
  IMediaInfo,
  IMediaConnections,
  IMediaAnswer,
  IConstraints,
  IMediaParams,
  IRedirectParams
} from './interfaces'

export class Util {
  private HOST = 'http://localhost:8000'
  private isLoop = true
  private media_manage: {[index: string]: {
    video_media_info: IMediaInfo | null,
    audio_media_info: IMediaInfo | null,
    video_rtcp_media_info: IMediaInfo | null,
    audio_rtcp_media_info: IMediaInfo | null
  }} = {}

  public async exit() {
    this.isLoop = false
    if (!!this.media_manage) {
      Object.keys(this.media_manage).map(async key => {
        try {
          await this.deleteMediaConnections(key)
        } catch (e) {
          console.error("deleteMediaConnections error:", e)
        }
      })
    }
    this.media_manage = {}
  }

  public async createPeer(key: string, peer_id: string): Promise<string> {
    const jsonData = {
      "key": key,
      "domain": "raspberrypi.local",
      "turn": true,
      "peer_id": peer_id,
    }
    const url = this.HOST + '/peers';
    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: jsonData,
    }
    try {
      const res = await request.default(options) as IPeersCreate
      console.log("createPeer res:", res)
      return res.params.token
    } catch (e) {
      console.error("createPeer is failed. error:" + e)
      throw new Error("createPeer is failed. error:" + e)
    }
  }

  public async createMedia(is_video: boolean): Promise<IMediaInfo> {
    const jsonData = {
      "is_video": is_video
    }
    const url = this.HOST + '/media'
    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: jsonData,
    }
    try {
      const res = await request.default(options) as IMediaCreate
      console.log("createMedia res:", res)
      const mediaInfo: IMediaInfo = {
        id: res.media_id,
        ip: res.ip_v4,
        port: res.port
      }
      return mediaInfo
    } catch (e) {
      console.error("createMedia is failed. error:" + e)
      throw new Error("createMedia is failed. error:" + e)
    }
  }

  public async createRtcp(): Promise<IMediaInfo> {
    const jsonData = {}
    const url = this.HOST + '/media/rtcp'
    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: jsonData,
    }
    try {
      const res = await request.default(options) as IMediaCreate
      console.log("createRtcp res:", res)
      const mediaInfo: IMediaInfo = {
        id: res.media_id,
        ip: res.ip_v4,
        port: res.port
      }
      return mediaInfo
    } catch (e) {
      console.error("createRtcp is failed. error:" + e)
      throw new Error("createRtcp is failed. error:" + e)
    }
  }

  public async waitMedia(peer_id: string, peer_token: string): Promise<string | null> {
    try {
      const ans = await Promise.all([this.createMedia(true), this.createRtcp(), this.waitCall(peer_id, peer_token)])
      const video_media_info = ans[0]
      const video_rtcp_media_info = ans[1]
      const media_connection_id = ans[2]
      this.media_manage[media_connection_id] = {
        video_media_info: video_media_info,
        audio_media_info: null,
        video_rtcp_media_info: video_rtcp_media_info,
        audio_rtcp_media_info: null
      }
      return media_connection_id
    } catch (e) {
      console.error("waitMedia is failed. error:" + e)
      throw new Error("waitMedia is failed. error:" + e)
    }
  }

  public async media(
    media_connection_id: string,
    video_params: IMediaParams | null,
    audio_params: IMediaParams | null,
    video_rtcp_params: IMediaParams | null,
    audio_rtcp_params: IMediaParams | null) {
    do {
      try {
        const media_info = this.media_manage[media_connection_id]
        if (!media_info) {
          return
        }
        const video_id = media_info.video_media_info?.id || null
        const audio_id = media_info.audio_media_info?.id || null
        const video_rtcp_id = media_info.video_rtcp_media_info?.id || null
        const audio_rtcp_id = media_info.audio_rtcp_media_info?.id || null
        await this.answer(
          media_connection_id,
          video_id,
          video_params,
          audio_id,
          audio_params,
          video_rtcp_id,
          video_rtcp_params,
          audio_rtcp_id,
          audio_rtcp_params
        )
        await this.waitReady(media_connection_id)
        if (!!media_info.video_media_info?.port) {
          const gst_process = this.execGstreamCamera(media_info.video_media_info.port)
          await this.waitStreamClose(media_connection_id)
          this.killGstreamCamera(gst_process, media_info.video_media_info.port)
        }
        delete this.media_manage[media_connection_id]
      } catch (e) {
        console.error(e)
        throws(e)
      }
    } while (this.isLoop)
  }

  public createConstraints(
    video_id: string | null,
    audio_id: string | null,
    video_rtcp_id: string | null,
    audio_rtcp_id: string | null): IConstraints {
    var constraints: IConstraints = {
      video: false,
      videoReceiveEnabled: false,
      audio: false,
      audioReceiveEnabled: false,
      video_params: {
        band_width: 1500,
        codec: "H264",
        media_id: "",
        rtcp_id: null,
        payload_type: 100
      },
      audio_params: {
        band_width: 1500,
        codec: "opus",
        media_id: "",
        rtcp_id: null,
        payload_type: 111
      }
    }
    if (!!video_id) {
      constraints.video = true
      constraints.videoReceiveEnabled = true
      constraints.video_params.media_id = video_id
      if (!!video_rtcp_id) {
        constraints.video_params.rtcp_id = video_rtcp_id
      }
    }
    if (!!audio_id) {
      constraints.audio = true
      constraints.audioReceiveEnabled = true
      constraints.audio_params.media_id = audio_id
      if (!!audio_rtcp_id) {
        constraints.audio_params.rtcp_id = audio_rtcp_id
      }
    }
    return constraints
  }

  public async call(
    peer_id: string,
    token: string,
    target_id: string,
    video_id: string | null,
    video_redirect: IMediaParams | null,
    audio_id: string | null,
    audio_redirect: IMediaParams | null,
    video_rtcp_id: string | null,
    video_rtcp_redirect: IMediaParams | null,
    audio_rtcp_id: string | null,
    audio_rtcp_redirect: IMediaParams | null): Promise<string> {
    var redirect_params: IRedirectParams = {}
    if (!!video_id && !!video_redirect) {
      redirect_params.video = video_redirect
    }
    if (!!video_rtcp_id && !!video_rtcp_redirect) {
      redirect_params.video_rtcp = video_rtcp_redirect
    }
    if (!!audio_id && !! audio_redirect) {
      redirect_params.audio = audio_redirect
    }
    if (!!audio_rtcp_id && !!audio_rtcp_redirect) {
      redirect_params.audio_rtcp = audio_rtcp_redirect
    }
    const url = this.HOST + '/media/connections'
    const constraints = this.createConstraints(
      video_id,
      audio_id,
      video_rtcp_id,
      audio_rtcp_id
    )
    const jsonData = {
      "peer_id": peer_id,
      "token": token,
      "target_id": target_id,
      "constraints": constraints,
      "redirect_params": redirect_params
    }
    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: jsonData,
    }
    try {
      const res = await request.default(options) as IMediaConnections
      console.log("call res:", res)
      return res.params.media_connection_id
    } catch (e) {
      console.error("call is failed. error:" + e)
      throw new Error("call is failed. error:" + e)
    }
  }

  public async answer(
    media_connection_id: string,
    video_id: string | null,
    video_redirect: IMediaParams | null,
    audio_id: string | null,
    audio_redirect: IMediaParams | null,
    video_rtcp_id: string | null,
    video_rtcp_redirect: IMediaParams | null,
    audio_rtcp_id: string | null,
    audio_rtcp_redirect: IMediaParams | null) {
    var redirect_params: IRedirectParams = {}
    if (!!video_id && !!video_redirect) {
      redirect_params.video = video_redirect
    }
    if (!!audio_id && !! audio_redirect) {
      redirect_params.audio = audio_redirect
    }
    if (!!video_rtcp_id && !!video_rtcp_redirect) {
      redirect_params.video_rtcp = video_rtcp_redirect
    }
    if (!!audio_rtcp_id && !! audio_rtcp_redirect) {
      redirect_params.audio_rtcp = audio_rtcp_redirect
    }
    const url = this.HOST + '/media/connections/' + media_connection_id + "/answer"
    const constraints = this.createConstraints(
      video_id,
      audio_id,
      video_rtcp_id,
      audio_rtcp_id
    )
    const jsonData = {
      "constraints": constraints,
      "redirect_params": redirect_params
    }
    const options = {
      url: url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      json: jsonData,
    }
    try {
      const res = await request.default(options) as IMediaAnswer
      console.log("answer res:", res)
    } catch (e) {
      console.error("answer is failed. error:" + e)
      throw new Error("answer is failed. error:" + e)
    }
  }
  
  public async waitEventFor(options: any, event: string): Promise<{}> {
    try {
      const res = await request.default(options) as string
      const eventRes: IEventRes = JSON.parse(res)
      // console.log("waitEventFor eventRes:", eventRes)
      // console.log("waitEventFor eventRes.event:", eventRes.event)
      if (eventRes.event === event) {
        return eventRes
      } else  {
        return await this.waitEventFor(options, event)
      }
    } catch (e) {
      // console.error("waitEventFor event:", event, " is failed. error:", e)
      return await this.waitEventFor(options, event)
    }
  }

  public async waitCall(peer_id: string, peer_token: string): Promise<string> {
    const url = this.HOST + '/peers/' + peer_id + '/events'
    const options = {
      url: url,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
      qs: {
        "token": peer_token
      },
    }
    try {
      const res = await this.waitEventFor(options, "CALL") as IEventsPeer
      console.log("waitCall res:", res)
      return res.call_params.media_connection_id
    } catch (e) {
      console.error("waitCall is failed. error:" + e)
      throw new Error("waitCall is failed. error:" + e)
    }
  }

  public async waitReady(media_connection_id: string) {
    const url = this.HOST + '/media/connections/' + media_connection_id + '/events'
    const options = {
      url: url,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }
    try {
      const res = await this.waitEventFor(options, "READY") as IEventsPeer
      console.log("waitReady res:", res)
      return
    } catch (e) {
      console.error("waitReady is failed. error:" + e)
      throw new Error("waitReady is failed. error:" + e)
    }
  }

  public async waitStream(media_connection_id: string) {
    const url = this.HOST + '/media/connections/' + media_connection_id + '/events'
    const options = {
      url: url,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }
    try {
      const res = await this.waitEventFor(options, "STREAM") as IEventsStream
      console.log("waitStream res:", res)
    } catch (e) {
      console.error("waitStream is failed. error:" + e)
      throw new Error("waitStream is failed. error:" + e)
    }
  }

  public async waitStreamClose(media_connection_id: string) {
    const url = this.HOST + '/media/connections/' + media_connection_id + '/events'
    const options = {
      url: url,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }
    try {
      const res = await this.waitEventFor(options, "CLOSE") as IEventsStream
      console.log("waitStreamClose res:", res)
    } catch (e) {
      console.error("waitStreamClose is failed. error:" + e)
      throw new Error("waitStreamClose is failed. error:" + e)
    }
  }

  public async waitPeerClose(peer_id: string, peer_token: string) {
    const url = this.HOST + '/peers/' + peer_id + '/events'
    const options = {
      url: url,
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
      qs: {
        "token": peer_token
      },
    }
    try {
      const res = await this.waitEventFor(options, "CLOSE") as IEventRes
      console.log("waitClose res:", res)
    } catch (e) {
      console.error("waitClose is failed. error:" + e)
      throw new Error("waitClose is failed. error:" + e)
    }
  }

  public async deletePeer(peer_id: string, peer_token: string) {
    const url = this.HOST + '/peers/' + peer_id
    const options = {
      url: url,
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
      qs: {
        "token": peer_token
      },
    }
    try {
      const res = await request.default(options)
      console.log("deletePeer res:", res)
    } catch (e) {
      console.error("deletePeer is failed. error:" + e)
      throw new Error("deletePeer is failed. error:" + e)
    }
  }

  public async deleteMediaConnections(media_connection_id: string) {
    const url = this.HOST + '/media/connections/' + media_connection_id
    const options = {
      url: url,
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
    }
    try {
      const res = await request.default(options)
      console.log("deleteMedia res:", res)
    } catch (e) {
      console.error("deleteMedia is failed. error:" + e)
      throw new Error("deleteMedia is failed. error:" + e)
    }
  }

  public getSerialNUmber(): string | null {
    var regex = {
      serial: /^Serial\s*:\s([0-9a-f]{16})$/,
    };
    var fn = "/proc/cpuinfo";
    var isExist = this.isExistFile(fn);
    var serial: string | null = null;
    var match: RegExpMatchArray | null = null;
    if (isExist) {
      var content = fs.readFileSync(fn, 'utf8');
      var lines = content.split(/\r\n|\r|\n/);
      lines.forEach(function(line) {
        if (regex.serial.test(line)) {
          match = line.match(regex.serial);
          if (!!match) {
            serial = match[1];
          }
        }
      });
    }
    return serial;
  }

  private isExistFile(file: string): boolean {
    try {
      fs.statSync(file);
      return true;
    } catch(err) {
      console.dir(err);
      return false;
    }
  }

  public execGstreamCamera(video_port: number): ChildProcess {
    return spawn("./bin/gstream-camera.sh", [String(video_port)])
  }

  public killGstreamCamera(gstreamCametaProcess: ChildProcess, port: number) {
    gstreamCametaProcess.kill()
    const arg = "port=" + String(port)
    spawn("pkill", ["-f", arg])
  }

  public startDocker() {
    console.log('waiting... started Docker')
    execSync('./bin/start-docker.sh')
    console.log('started Docker')
  }

  public stopDocker() {
    console.log('waiting... stopped Docker')
    execSync('./bin/stop-docker.sh')
    console.log('stopped Docker')
  }
}