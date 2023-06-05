const {cutString} = require('../utils/')
const ModelWorker = require('../workers/ModelWorker')
const Snapshot = require('./Snapshot')
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
    allowedTime = 10 // seconds

    photosForReport = []
    extra

    _version = "1.0.0"

    constructor(camera, algorithm, extra) {
        this.camera = camera
        this.algorithmName = algorithm
        this.controlType = cutString(algorithm, 0, "_control")
        this.debugColor = CONSOLE_COLORS[this.controlType]
        this.extra = extra
    }

    setVersion(v) {
        this._version = v
    }

    getVersion() {
        return this._version
    }

    async loadModels() {
        if (!this.model) {
            console.time(`${this.controlType} model load`)
            this.model = {
                w: new ModelWorker("wn"),
                o: new ModelWorker("hkk")
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
            if (!this.predictions) return
            this.check()
        } catch (e) {
            console.log(e, 'e')
        }
    }

    async getWorkersPredictions(workers) {
        if (!this.camera.snapshot.buffer) return
        let execs = []
        for (const worker of workers) {
            execs.push(worker.exec(this.camera.snapshot.buffer))
        }
        return await Promise.all(execs)
    }

    update() {
    }

    async detect() {
    }

    check() {
    }

    isPeopleOnFrame() {
        return !!this.predictions.length
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
            console.log(error)
        }
        return detection
    }

    erasePhotosIfArrayIsEmpty(array) {
        array.length > 0 ?
            this.photosForReport = [...this.photosForReport, new Snapshot(this.camera.snapshot.buffer)]
            : this.photosForReport = []
    }

    sendReportIfPhotosEnough() {
        if (this.photosForReport.length === this.allowedTime) this.sendReport()
    }

    sendReport(controlPayload) {
        const report = new Report(this.camera.serverUrl, this.camera.hostname, this.algorithmName, this.photosForReport, controlPayload)
        report.send()
        this.photosForReport = []
    }

}

module.exports = {Control}
