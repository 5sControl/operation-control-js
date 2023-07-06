const dispatcher = require('./Dispatcher')
const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')

class Control {

    camera = new Camera()
    detector = new Detector()
    operation = new Operation()

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
        // dispatcher.emit("tick completed", false)
    }

}

module.exports = Control