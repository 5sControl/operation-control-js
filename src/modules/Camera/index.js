const fs = require('fs')

class Camera {

    snapshot = {
        uri: "",
        buffer: null
    }

    isLocalDebug = process.env.isLocalDebug || false
    lastSnapshotLength = 0

    constructor(camera_url) {
        this.snapshot.uri = camera_url
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
            if (!this.camera.snapshot.buffer) return
            if (this.camera.snapshot.buffer.length < 1000) {
                const {logger} = require("../Logger")
                logger("translation broken", `buffer length is ${buffer.length} \n`)
                return
            }
            if (this.camera.isVideoStreamOnPause()) return
            return this.snapshot.buffer
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