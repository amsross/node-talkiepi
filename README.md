# node-talkiepi
> a node based, mumble client for running on a raspberry pi inspired by [@dchote's talkiepi](https://github.com/dchote/talkiepi)

## dependencies
* a [raspberry pi](https://www.raspberrypi.org/) - for all the things
* a [mumble server](https://wiki.mumble.info/wiki/Main_Page) - for voice

## setup

1. Setup system requirements

        sudo apt-get update
        sudo apt-get upgrade
        sudo apt-get install git alsa-base alsa-utils libasound2-dev espeak libespeak-dev
        sudo ln -s /usr/lib/arm-linux-gnueabihf/espeak-data/ /usr/share/espeak-data

2. Setup node-talkiepi

        git clone https://github.com/amsross/node-talkiepi.git /home/talkiepi/
        cd /home/pi
        // you'll be asked to authenticate for sudo
        //  this is required for raspi-io
        sudo npm install

3. Setup a systemd service

        sudo cp talkiepi.service /etc/systemd/system/
        // add --server, --username, and --password (if necessary)
        //  arguments to ExecStart command
        sudo vi /etc/systemd/system/talkiepi.service
        sudo systemctl enable talkiepi.service
        sudo systemctl start talkiepi.service

