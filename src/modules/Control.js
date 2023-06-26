const {logger} = require("./Logger")
const {cutRegionFromBlob} = require('./utils')
const ModelWorker = require('./Detector/workers/ModelWorker')
const Report = require('./Report')

class Control {

    camera
    model
    predictions

    photosForReport = []

    constructor(camera) {
        this.camera = camera
    }

    async loadModels() {
        if (!this.model) {
            console.time(`models load`)
            this.model = {
                w: new ModelWorker("ww"),
                o: new ModelWorker("wo")
            }
            await this.getWorkersPredictions([this.model.w, this.model.o])
            console.timeEnd(`models load`)
        }
    }

    async start(isWithTimer = true) {
        await this.loadModels()
        if (isWithTimer) setInterval(async () => await this.getPredictions(), 1000)
    }

    async getPredictions() {
        try {

            /// to Camera
            if (!this.camera.snapshot.buffer) return
            if (this.camera.snapshot.buffer.length < 1000) {
                logger("translation broken", `buffer length is ${this.camera.snapshot.buffer.length} \n`)
                return
            }
            //// 

            this.predictions = null
            try {
                const prev = Date.now()
                const [result_w, result_o] = await this.getWorkersPredictions([this.model.w, this.model.o])
                this.predictions = {
                    w: result_w,
                    o: result_o
                }
                const now = Date.now()
                console.log(`detection: ${now - prev}ms`)
            } catch (error) {
                console.log(error, 'setInterval error')
            }
            if (!this.predictions.w || !this.predictions.o) return

            this.check()

        } catch (e) {
            console.log(e, 'e')
        }
    }

    async getWorkersPredictions(workers) {
        if (!this.camera.snapshot.buffer) return
        const wnRes = await workers[0].exec(this.camera.snapshot.buffer)
        let woRes = []
        let worker = wnRes?.find(d => d.class === 'worker')
        if (worker) {
            const workerBlob = await cutRegionFromBlob(this.camera.snapshot.buffer, [1080, 1920], worker.bbox)
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

    check() {
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

    sendReport(controlPayload) {
        const report = new Report(this.camera.serverUrl, this.camera.hostname, "operation_control", this.photosForReport, controlPayload)
        report.send()
        this.photosForReport = []
    }

}

module.exports = {Control}
