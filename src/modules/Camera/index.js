const fs = require('fs')

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

    isLocalDebug = process.env.isLocalDebug || false
    lastSnapshotLength = 0

    constructor() {
    }

    async init(reqBody, folder) {
        this.serverUrl = reqBody["server_url"]
        this.hostname = folder.split('/')[1]
        this.snapshot.uri = reqBody["camera_url"]

        await this.getSnapshot()
        
        const interval = setInterval(async () => {
            this.getSnapshot()
        }, 1000)
        return {
            interval,
            snapshot: this.snapshot,
            camera: this
        }
    }

    async getSnapshot() {
        try {
            if (this.isLocalDebug) {
                this.snapshot.buffer = fs.readFileSync('src/modules/Camera/snapshot.jpeg')
            } else {                
                const response = await fetch(this.snapshot.uri)
                console.log(response)
                this.snapshot.buffer = response
            }
        } catch (error) {
            console.log('code: ', error.code)
            console.log('socket: ', error.socket?.remoteAddress)
        }
    }

    isVideoStreamOnPause() {
        const isPause = this.snapshot.buffer.length === this.lastSnapshotLength
        this.lastSnapshotLength = this.snapshot.buffer.length
        return isPause
    }

}

module.exports = Camera
