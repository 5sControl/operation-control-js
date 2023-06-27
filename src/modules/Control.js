const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')

class Control {

    camera = new Camera(process.env.camera_url)

    detector = new Detector()
    WORKSPACE_BOUNDARIES = [1600, 900]

    operation = new Operation()

    async start(isWithTimer = true) {
        await this.detector.loadModels()
        if (isWithTimer) setInterval(() => this.check(), 1000)
    }

    async check(bufferFromGer) {

        if (bufferFromGer) {
            this.camera.snapshot.buffer = bufferFromGer
        } else {
            await this.camera.getSnapshot()
            if (!this.camera.snapshot.buffer) return
            if (this.camera.snapshot.buffer.length < 1000) {
                const {logger} = require("./Logger")
                logger("translation broken", `buffer length is ${buffer.length} \n`)
                return
            }
            if (this.camera.isVideoStreamOnPause()) return
        }

        await this.detector.getPredictions(this.camera.snapshot.buffer)

        // this.detector.isWDetected()
        let detectClasses = new Set()
        for (const detection of this.detector.isAnyDetections()) detectClasses.add(detection.class)
        // update this.window and this.worker
        const window = this.detector.predictions.w?.find(detection => detection.class === "window" && detection.score > 0.5)
        let full_w = detectClasses.has("window") && detectClasses.has("worker")
        let empty_w = !detectClasses.has("window") && !detectClasses.has("worker")
        // this.detector.isHKKDetected()
        let isHKKdetected = this.detector.isAnyDetections(["hkk"], "boolean", 0.9)

        this.operation.check(window, full_w, empty_w, this.camera.snapshot.buffer, isHKKdetected, this.detector.predictions.o[0])
    }

}

module.exports = Control