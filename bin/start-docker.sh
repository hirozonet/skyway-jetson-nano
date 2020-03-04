#!/bin/sh

docker run -itd --name gateway -p 8000:8000 -p 50000-50063:50000-50063/udp skyway-webrtc-gateway
until [ "`docker inspect -f {{.State.Running}} gateway`"=="true" ]; do sleep 0.5; done
sleep 5.0