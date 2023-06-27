const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')

class Control {

    camera = new Camera(process.env.camera_url)
    detector = new Detector()
    operation = new Operation()

    async start(isWithTimer = true) {
        await this.detector.loadModels()
        if (isWithTimer) setInterval(() => this.check(), 1000)
    }

    async check(bufferFromGer) {
        let checkBuffer = bufferFromGer ? bufferFromGer : await this.camera.getSnapshot()
        if (checkBuffer) {
            await this.detector.getPredictions(checkBuffer)
            
            // this.detector.isWDetected()
            let detectClasses = new Set()
            for (const detection of this.detector.isAnyDetections()) detectClasses.add(detection.class)
            // update this.window and this.worker
            const window = this.detector.predictions.w?.find(detection => detection.class === "window" && detection.score > 0.5)
            let full_w = detectClasses.has("window") && detectClasses.has("worker")
            let empty_w = !detectClasses.has("window") && !detectClasses.has("worker")
            // this.detector.isHKKDetected()
            let isHKKdetected = this.detector.isAnyDetections(["hkk"], "boolean", 0.9)
    
            this.operation.check(window, full_w, empty_w, checkBuffer, isHKKdetected, this.detector.predictions.o[0])
        }
    }

}

module.exports = Control