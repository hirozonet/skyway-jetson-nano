#!/bin/sh

docker run --platform linux/arm -itd --name gateway -p 8000:8000 -p 50000-50063:50000-50063/udp hirozonet/skyway-jetson-nano
until [ "`docker inspect -f {{.State.Running}} gateway`"=="true" ]; do sleep 0.5; done
sleep 1.0