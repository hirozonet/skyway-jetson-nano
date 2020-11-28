#!/bin/sh

gst-launch-1.0 nvarguscamerasrc ! \
  'video/x-raw(memory:NVMM),width=1920,height=1080,format=NV12,framerate=30/1' ! \
  nvvidconv flip-method=2 ! \
  'video/x-raw,width=640,height=480' ! \
  nvvidconv ! \
  clockoverlay time-format="%Y/%m/%d %H:%M:%S" font-desc="Sans,24" ! \
  omxh264enc bitrate=2000000 ! \
  h264parse ! \
  rtph264pay config-interval=1 pt=96 ! \
  tee name=s \
    s.src_0 ! \
    queue ! \
    udpsink host=127.0.0.1 port=5000 \
    s.src_1 ! \
    queue ! \
    udpsink host=127.0.0.1 port=5001 \
    s.src_2 ! \
    queue ! \
    udpsink host=127.0.0.1 port=5002
