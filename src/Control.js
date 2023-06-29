const dispatcher = require('./Dispatcher')
const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')
const fs = require('fs')

class Control {

    camera = new Camera()
    detector = new Detector()
    operation = new Operation()

    isRecording = false
    recordedSnapshots = 0
    constructor() {
        dispatcher.on("Begin of operation", () => this.isRecording = true)
        dispatcher.on("End of operation", () => this.isRecording = false)
    }

    async start(isWithTimer = true) {
        await this.detector.loadModels()
        if (isWithTimer) setInterval(() => this.check(), 1000)
        dispatcher.emit("control started")
    }

    async check(bufferFromGer) {
        let checkBuffer = bufferFromGer ? bufferFromGer : await this.camera.getSnapshot()
        if (checkBuffer) {
            const detections = await this.detector.detect(checkBuffer)
            this.operation.check(checkBuffer, detections)
        }

        if (this.recordedSnapshots < 600 && this.isRecording) {
            this.recordedSnapshots++
            fs.writeFile(`${process.env.currentDebugFolder + "/snapshots"}/${this.recordedSnapshots}.jpeg`, checkBuffer, error => {
                if (error) console.log(error)
            })
        } else {
            this.recordedSnapshots = 0
            this.isRecording = false
        }

    }

}

module.exports = Control