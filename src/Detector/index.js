const ModelWorker = require('./workers/ModelWorker')
const Snapshot = require('../Snapshot')

class Detector {

    model
    predictions

    async loadModels() {
        if (!this.model) {
            console.time(`models load`)
            this.model = {
                w: new ModelWorker("ww"),
                o: new ModelWorker("wo")
            }
            console.timeEnd(`models load`)
        }
    }
    async getPredictions(buffer) {
        try {
            this.predictions = null
            try {
                const prev = Date.now()
                const [result_w, result_o] = await this.getWorkersPredictions([this.model.w, this.model.o], buffer)
                this.predictions = {
                    w: result_w,
                    o: result_o
                }
                const now = Date.now()
                console.log(`detection: ${now - prev}ms`)
            } catch (error) {
                console.log(error, 'setInterval error')
            }
            // if (!this.predictions.w || !this.predictions.o) return
        } catch (e) {
            console.log(e, 'e')
        }
    }
    async getWorkersPredictions(workers, buffer) {
        const wnRes = await workers[0].exec(buffer)
        let woRes = []
        let worker = wnRes?.find(d => d.class === 'worker')
        if (worker) {
            const snapshot = new Snapshot(buffer)
            const workerBlob = await snapshot.cutRegionFromBlob(worker.bbox)
            woRes = await workers[1].exec(workerBlob)
            const OFFSET_X = worker.x
            const OFFSET_Y = worker.y
            woRes = woRes.map(d => {
                d.x = d.x + OFFSET_X
                d.y = d.y + OFFSET_Y
                d.bbox[0] = d.x
                d.bbox[1] = d.y
                return d
            })
        }
        return [wnRes, woRes]
    }
    /**
     * @param {string[]} classes Classes to detect
     * @param {number} minScore Minimum detection score
     * @param {("array" | "boolean")} returnType What type to return
     */
    isAnyDetections(classes, returnType = "array", minScore = 0.5) {
        const checkClass = prediction => classes === undefined ? true : classes.includes(prediction.class)
        const isReturnArray = returnType === "array" ? true : false
        let detection = isReturnArray ? [] : false
        const predictions = isReturnArray ? this.predictions.w : this.predictions.o
        try {
            for (const prediction of predictions) {
                if (checkClass(prediction) && prediction.score > minScore) {
                    isReturnArray ? detection.push(prediction) : detection = true
                }
            }
        } catch (error) {
            console.log("isAnyDetections", error)
        }
        return detection
    }
}

module.exports = Detector