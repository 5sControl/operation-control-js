const {isExists, arrayBufferToBuffer, parseRTSPuri} = require('../utils/')

class Camera {

    serverUrl = ""
    hostname = ""
    username = ""
    password = ""
    snapshot = {
        uri: "",
        buffer: null
    }
    client = null
    resolution = [1080, 1920]

    isDebug = false
    lastSnapshotLength = 0

    constructor() {
    }

    async init(reqBody, isDebug = false, SERVER_IP) {
        this.serverUrl = reqBody["server_url"]
        this.hostname = SERVER_IP
        this.snapshot.uri = reqBody["camera_url"]

        this.auth()
        await this.getSnapshot()
        isExists(`images/${SERVER_IP}`)
        // this.setResolution()

        const interval = setInterval(async () => {
            this.getSnapshot()
        }, 1000)
        return {
            interval,
            snapshot: this.snapshot,
            camera: this
        }
    }

    auth() {
        try {
            const DigestFetch = require('../utils/digest-fetch')
            this.client = new DigestFetch('test', 'test')
        } catch (error) {
            console.log(error)
        }
    }

    async getSnapshot() {
        try {
            const response = await this.client.fetch(this.snapshot.uri)
            const arrayBuffer = await response.arrayBuffer()
            this.snapshot.buffer = arrayBufferToBuffer(arrayBuffer)
        } catch (error) {
            console.log('code: ', error.code)
            console.log('socket: ', error.socket?.remoteAddress)
        }
    }

    setResolution() {
        const {getSync} = require('@andreekeberg/imagedata')
        const {width, height} = getSync(this.snapshot.buffer)
        this.resolution = [height, width]
    }

    isVideoStreamOnPause() {
        const isPause = this.snapshot.buffer.length === this.lastSnapshotLength
        this.lastSnapshotLength = this.snapshot.buffer.length
        return isPause
    }

}

module.exports = Camera