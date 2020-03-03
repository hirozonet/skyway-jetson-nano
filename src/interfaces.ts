export interface IErrors {
  command_type: string,
  errors: {
    field: string,
    message: string
  }
}

export interface IPeersCreate {
  command_type: string,
  params: {
    peer_id: string,
    token: string
  }
}

export interface IMediaCreate {
  media_id: string,
  port: number,
  ip_v4: string,
  ip_v6: string
}

export interface IEventRes {
  event: string
}

export interface IEventsPeer {
  event: string,
  peer_params: {
    peer_id: string,
    token: string
  },
  call_params: {
    media_connection_id: string
  },
  data_params: {
    data_connection_id: string
  },
  error_message: string
}

export interface IEventsStream {
  event: string,
  stream_options: {
    is_video: boolean,
    stream_params: {
      media_id: string,
      port: number,
      ip_v4: string,
      ip_v6: string
    }
  },
  close_options: {},
  error_message: string
}

export interface IMediaInfo {
  id: string,
  ip: string,
  port: number
}

export interface IMediaConnections {
  command_type: string,
  params: {
    media_connection_id: string
  }
}

export interface IMediaAnswer {
  command_type: string,
  params: {
    video_port?: number,
    video_id?: string,
    audio_port?: number,
    audio_id?: string
  }
}

export interface IConstraints {
  video: boolean,
  videoReceiveEnabled: boolean,
  audio: boolean,
  audioReceiveEnabled: boolean,
  video_params: {
    band_width: number,
    codec: string,
    media_id: string,
    rtcp_id: string | null,
    payload_type: number
  },
  audio_params: {
    band_width: number,
    codec: string,
    media_id: string,
    rtcp_id: string | null,
    payload_type: number
  }
}

export interface IMediaParams {
  ip_v4: string,
  ip_v6?: string,
  port: number,
}

export interface IRedirectParams {
  video?: IMediaParams,
  audio?: IMediaParams,
  video_rtcp?: IMediaParams,
  audio_rtcp?: IMediaParams
}

