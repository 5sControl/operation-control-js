const dispatcher = require('./Dispatcher')
const Camera = require('./Camera')
const Detector = require('./Detector')
const Operation = require('./Operation')

class Control {

    async start() {

        this.camera = new Camera()
        this.detector = await new Detector().init()
        this.operation = new Operation()
        this.batch = []

        setInterval(() => this.check(), 1000)
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
                const result = this.detector.detectBatch(batchCopy)
                console.log(result)
                // this.operation.check(checkBuffer, detections)
            }
        }
    }

}

module.exports = Control