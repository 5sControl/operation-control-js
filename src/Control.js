const dispatcher = require('./Dispatcher')
const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')

class Control {

    camera = new Camera()
    detector = new Detector()
    operation = new Operation()
    batch = []

    async start(isWithTimer = true) {
        await this.detector.loadModels()
        if (isWithTimer) setInterval(() => this.check(), 1000)
        process.env.N_CPUS = require('os').cpus().length
        dispatcher.emit("control started")
    }

    async check(bufferFromGer) {
        let checkBuffer = await this.camera.getSnapshot(bufferFromGer)
        if (checkBuffer) {
            
            this.batch.push(checkBuffer)
            if (this.batch.length === +process.env.N_CPUS) {
                console.log("detect batch")
                const batchCopy = [...this.batch]
                this.batch = []
                this.detector.detectBatch(batchCopy)
            } else {
                // console.log(this.batch.length)
                // console.log(process.env.N_CPUS)
            }

            // console.log(`\n${new Date().toLocaleTimeString()} checkBuffer:`, checkBuffer.length)
            // const detections = await this.detector.detect(checkBuffer)
            // this.operation.check(checkBuffer, detections)

        }
        // dispatcher.emit("tick completed", false)
    }

}

module.exports = Control