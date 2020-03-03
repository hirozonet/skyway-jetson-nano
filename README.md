# skyway-jetson-nano
Send videos using Skyway on Jetson nano.

## Prerequisite
### Hardware
- Jetson Nano Developer Kit
- Raspberry Pi Camera Module V2
### Software
- JetPack SD Card Image r32.3.1
- NodeJS v12

## Install Packages
```
npm install
```

## Building
```
npm run build
```

## Setup API KEY
```
cp .env.sample .env
```
Then set the Skyway API KEY in the .env file.

## Run
```
npm run start
```
