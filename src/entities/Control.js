const fs = require('fs')
const {logger} = require("./Logger")
const {cutString, cutRegionFromBlob, djangoDate} = require('../utils/')
const ModelWorker = require('../workers/ModelWorker')
const Report = require('./Report')
const setColor = colorCode => `\x1b[${colorCode}m%s\x1b[0m`
let CONSOLE_COLORS = {
    "standart": setColor("33"),
    "operation": setColor("34")
}
const MODELS_PATH = {
    "standart": "./yolov8m/model.json"
}

class Control {

    camera
    model
    predictions
    timer

    algorithmName
    controlType

    // options
    CHECK_TIME = 1000

    photosForReport = []
    extra

    constructor(camera, algorithm, extra) {
        this.camera = camera
        this.algorithmName = algorithm
        this.controlType = cutString(algorithm, 0, "_control")
        this.debugColor = CONSOLE_COLORS[this.controlType]
        this.extra = extra
    }

    async loadModels() {
        if (!this.model) {
            console.time(`${this.controlType} model load`)
            let modelPath = ["idle", "machine", 'min_max'].includes(this.controlType) ? MODELS_PATH["standart"] : MODELS_PATH[this.algorithmName]
            this.model = {
                w: new ModelWorker("ww"),
                o: new ModelWorker("wo")
            }
            await this.getWorkersPredictions([this.model.w, this.model.o])
            console.timeEnd(`${this.controlType} model load`)
        }
    }

    async start(isWithTimer = true) {
        await this.loadModels()
        if (isWithTimer) {
            this.timer = setInterval(async () => await this.getPredictions(), this.CHECK_TIME)
            console.log(this.debugColor, `${this.controlType} control started`)
            return this.timer
        }
    }

    async getPredictions() {
        try {
            if (!this.camera.snapshot.buffer) return
            if (this.camera.snapshot.buffer.length < 1000) {
                logger("translation broken", `buffer length is ${this.camera.snapshot.buffer.length} \n`)
                return
            }
            this.predictions = null
            try {
                const prev = Date.now()
                const [result_w, result_o] = await this.getWorkersPredictions([this.model.w, this.model.o])
                this.predictions = {
                    w: result_w,
                    o: result_o
                }
                const now = Date.now()
                console.log(`${this.controlType} model detection ${now - prev}ms`)
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
            const workerBlob = await cutRegionFromBlob(this.camera.snapshot.buffer, this.camera.resolution, worker.bbox)
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
        const report = new Report(this.camera.serverUrl, this.camera.hostname, this.algorithmName, this.photosForReport, controlPayload)
        report.send()
        this.photosForReport = []
    }

}

module.exports = {Control}
