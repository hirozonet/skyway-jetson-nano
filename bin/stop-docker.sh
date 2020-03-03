#!/bin/sh

docker stop gateway
until [ "`docker inspect -f {{.State.Running}} gateway`"=="false" ]; do sleep 0.5; done
sleep 1.0
docker rm gateway