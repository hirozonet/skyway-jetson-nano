# skyway-jetson-nano
Send videos using Skyway on Jetson nano.

## Prerequisite
### Hardware
- Jetson Nano Developer Kit
- Raspberry Pi Camera Module V2
### Software
- JetPack SD Card Image r32.4.4
- NodeJS v12/v14

### Docker Build
```
docker build ./ -t <TAG_NAME>
```

## Install Packages
```
npm install
```

## Building
```
npm run build
```

## Setup API KEY & Enable/Disable Recording
```
cp .env.sample .env
```
Then set the Skyway API KEY in the .env file.

## Run
```
npm run start
```
