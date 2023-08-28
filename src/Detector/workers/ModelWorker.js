const workerpool = require('workerpool')

class ModelWorker {
    pool = null
    constructor(workerName) {
        this.pool = workerpool.pool(__dirname + `/${workerName}.js`)
    }
    async exec(buffer) {
        try {
            const detections = await this.pool.exec('detect', [buffer])
            return detections
        } catch (error) {
            console.error(error)
        }
    }
    terminate() {
        this.pool.terminate()
    }
}

module.exports = ModelWorker