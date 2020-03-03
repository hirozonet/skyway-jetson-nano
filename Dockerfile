FROM forumi0721alpinearmhf/alpine-armhf-glibc:latest

#default 8000
ENV PORT_NUM 8000
#error/warn/debug
ENV LOG_LEVEL "error"

# Set the working directory to /skyway
WORKDIR /skyway

RUN apk add --no-cache --virtual tmpPackages ca-certificates wget && \
    wget https://github.com/skyway/skyway-webrtc-gateway/releases/download/0.2.1/gateway_linux_arm && \
    chmod +x ./gateway_linux_arm && \
    apk add libgcc && \
    apk add libuuid && \
    apk add libpthread-stubs && \
    rm /root/.wget-hsts && \
    echo [general] > ./config.toml && \
    echo api_port=$PORT_NUM >> ./config.toml && \
    echo log_level=\"$LOG_LEVEL\" >> ./config.toml && \
    apk del tmpPackages

ENV LD_LIBRARY_PATH /lib:/lib/glibc:/usr/lib

# Run rest when the container launches
ENTRYPOINT /skyway/gateway_linux_arm