FROM arm32v7/alpine:3.10

#default 8000
ENV PORT_NUM 8000
#error/warn/debug
ENV LOG_LEVEL "error"

# Set the working directory to /skyway
WORKDIR /skyway

COPY armv7 armv7/.

RUN apk add --no-cache --virtual tmpPackages ca-certificates wget && \
    wget https://github.com/skyway/skyway-webrtc-gateway/releases/download/0.3.2/gateway_linux_arm && \
    chmod +x ./gateway_linux_arm && \
    apk add --allow-untrusted armv7/glibc-2.30-r0.apk && \
    apk add libgcc && \
    apk add libuuid && \
    rm /root/.wget-hsts && \
    rm -fr armv7/ && \
    ln -s /usr/glibc-compat/lib/ld-linux-armhf.so.3 /lib/ld-linux-armhf.so.3 && \
    ln -s /usr/glibc-compat/lib /lib/glibc && \
    echo [general] > ./config.toml && \
    echo api_port=$PORT_NUM >> ./config.toml && \
    echo log_level=\"$LOG_LEVEL\" >> ./config.toml && \
    apk del tmpPackages

ENV LD_LIBRARY_PATH /lib:/lib/glibc:/usr/lib

# Run rest when the container launches
ENTRYPOINT /skyway/gateway_linux_arm