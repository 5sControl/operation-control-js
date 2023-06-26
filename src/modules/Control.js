const {logger} = require("./Logger")
const {djangoDate, bBox, isExists} = require('./utils')

const Camera = require('./Camera')

const {cutRegionFromBlob} = require('./utils')
const ModelWorker = require('./Detector/workers/ModelWorker')

const Snapshot = require('./Snapshot')
const Report = require('./Report')

const EVENTS = [
    "Begin of operation",
    "Corner processed",
    "End of operation"
]

class Control {

    camera

    // operation
    operationId = null
    startTracking = null
    stopTracking = null
    cornersProcessed = 0

    // counters
    isBeginTimer = 0
    isEndTimer = 0

    window = {
        bbox: [], // Rect
        edgeCorners: [null, null], // [Point, Point], left and right of current side
        currentSide: "first" // "first", "second"
    }
    processedSide = null
    timeFromLastProcessedCorner = 0
    cornersState = [false, false, false, false]
    isLocalDebug = process.env.isLocalDebug || false

    hkkCounter = 0
    hkkLast = null

    logs = []

    photosForReport = []

    constructor() {}
    async start(isWithTimer = true) {

        this.camera = new Camera(process.env.camera_url)
        await this.loadModels()

        if (isWithTimer) setInterval(async () => {
            await this.camera.getSnapshot()
            await this.getPredictions()
        }, 1000)
    }

    //Detector
    WORKSPACE_BOUNDARIES = [1600, 900]
    HKK_MIN_SCORE = 0.9
    model
    predictions
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
    withinWorkspace(bbox) { // refactor[2D]: rect in another rect
        const [x, y, width, height] = bbox
        return x < this.WORKSPACE_BOUNDARIES[0] && y < this.WORKSPACE_BOUNDARIES[1] ? true : false
    }

    async check() {
        if (this.camera.isVideoStreamOnPause()) return
        this.cleanLogs()
        this.status()
        if (this.startTracking) this.isCornerProcessed()
    }


    status() {
        // Control.isAnyDetections([], "set")
        let detectClasses = new Set()
        for (const detection of this.isAnyDetections()) detectClasses.add(detection.class)

        // update this.window and this.worker
        const window = this.predictions.w?.find(detection => detection.class === "window" && detection.score > 0.5)
        if (window) {
            this.window.bbox = window.bbox
            const [x, y, width, height] = this.window.bbox
            this.window.edgeCorners = [[x, y+height], [x+width, y+height]]
        }
        let full_w = detectClasses.has("window") && detectClasses.has("worker")
        let empty_w = !detectClasses.has("window") && !detectClasses.has("worker")

        if (full_w && !this.startTracking) {
            if (!this.withinWorkspace(this.window.bbox)) return
            this.isBeginTimer++
            this.writeToLogs(`Worker with window appeared: ${this.isBeginTimer}s`)
            if (this.isBeginTimer > 5) this.begin()
        }
        if (empty_w && this.startTracking && !this.stopTracking) {
            this.isEndTimer++
            this.writeToLogs(`Worker with window disappeared: ${this.isEndTimer}s`)
            if (this.isEndTimer > 5) this.end()
        }
    }
    async begin() {
        this.operationId = +new Date()
        this.startTracking = djangoDate(new Date())
        this.isBeginTimer = 0
        this.window.currentSide = "first"
        this.writeToLogs(EVENTS[0])
        this.addToReport(EVENTS[0])
    }
    async end() {
        this.operationId = null
        this.stopTracking = djangoDate(new Date())
        this.isEndTimer = 0

        this.processedSide = null
        this.timeFromLastProcessedCorner = 0
        this.hkkLast = null

        this.writeToLogs(EVENTS[EVENTS.length - 1])
        await this.addToReport(EVENTS[EVENTS.length - 1])

        const report = new Report(this.photosForReport, { 
            cornersProcessed: this.cornersProcessed,
            startTracking: this.startTracking,
            stopTracking: this.stopTracking,
            operationType: this.cornersProcessed === 0 ? "unknown" : "cleaning corners"
        })
        report.send()
        this.photosForReport = []

        this.cornersProcessed = 0
        this.cornersState = [false, false, false, false]
        this.startTracking = null
        this.stopTracking = null

    }
    async isCornerProcessed() {
        this.timeFromLastProcessedCorner++
        let isHKKdetected = this.isAnyDetections(["hkk"], "boolean", this.HKK_MIN_SCORE)
        if (isHKKdetected) {
            // also 2D (is hkk-rect in wspace-rect)
            const [x, y] = bBox.getOrigin(this.predictions.o[0].bbox)
            if (x < this.WORKSPACE_BOUNDARIES[0] && y < this.WORKSPACE_BOUNDARIES[1]) {
                if (this.isOperationOnWindow(this.predictions.o[0].bbox, this.window.bbox)) {
                    this.hkkCounter++
                    this.hkkLast = this.predictions.o[0]
                } else {
                    this.writeToLogs('hkk not on window!')
                }
            }
        } else {
            if (this.hkkCounter >= 1) {
                this.writeToLogs("Action performed", false) // Найдена операция
                const currentSide = this.whatSide()
                if (this.processedSide === null) {
                    this.writeToLogs("No side has been counted yet", false) // Никакой стороны ещё не было засчитано
                    await this.addCleanedCorner(currentSide)
                } else {
                    this.writeToLogs("Some angle was counted", false) // Какой-то угол был засчитан
                    if (currentSide === this.processedSide) {
                        this.writeToLogs(`It was the same corner (${this.processedSide})`, false) // Это был тот же угол
                        if (this.timeFromLastProcessedCorner > 30) {
                            await this.addCleanedCorner(currentSide)
                            this.writeToLogs(`Same angle but more than 30 seconds`, false) // Тот же угол, но больше 30 секунд
                        }
                    } else {
                        await this.addCleanedCorner(currentSide)
                        this.writeToLogs(`It was a different angle (${this.processedSide})`, false) // Это был другой угол
                    }
                }
            }
            this.hkkCounter = 0
        }
    }
    async addCleanedCorner(processedSide) {
        this.cornersProcessed++
        this.processedSide = processedSide
        this.timeFromLastProcessedCorner = 0
        if (this.cornersProcessed === 3) this.window.currentSide = "second"
        this.updateCornersState()
        this.writeToLogs(EVENTS[1])
        this.addToReport(`${this.cornersProcessed} corner processed`, true)
        if (this.isLocalDebug) {
            isExists(`debug/${this.operationId}`)
            let snapshot = new Snapshot(this.camera.snapshot.buffer)
            snapshot.saveTo(`debug/${this.operationId}/${this.cornersProcessed}.jpeg`)
        }
    }
    updateCornersState() {
        let i = null
        switch (this.window.currentSide) {
            case "first":
                i = this.processedSide === "left" ? 0 : 1
                break
            case "second":
                i = this.processedSide === "left" ? 2 : 3
                break
        }
        this.cornersState[i] = true
    }
    async addToReport(event, isDrawCornersState = false) {
        let snapshot = new Snapshot(this.camera.snapshot.buffer)
        let promises = [snapshot.drawEvent(event)]
        if (isDrawCornersState) promises.push(snapshot.drawCornersState(this.window.bbox, this.cornersState, this.window.currentSide))
        await Promise.all(promises)
        this.photosForReport = [...this.photosForReport, snapshot]
    }

    // 2D
    /**
     * @returns {"left" | "right"}
     */
    whatSide() {
        if (this.hkkLast.bbox !== null) {
            const operationOrigin = bBox.getOrigin(this.hkkLast.bbox)
            if (operationOrigin) {
                const diffX = operationOrigin[0] - this.window.edgeCorners[0][0]
                const halfWindowWidth = (this.window.edgeCorners[1][0] - this.window.edgeCorners[0][0])/2
                const side = diffX < halfWindowWidth ? "left" : "right"
                return side
            }
        } else {
            return "right"
        }
    }
    isOperationOnWindow(operationBbox, windowBbox) {
        const operationRect = this.convertBboxToRect(operationBbox)
        const windowRect = this.convertBboxToRect(windowBbox)
        return this.rectanglesIntersect(operationRect, windowRect)
    }
    convertBboxToRect(bbox) {
        const [x, y, width, height] = bbox
        return [x, y, x + width, y + height]
    }
    /**
     * @returns {boolean}
     */
    rectanglesIntersect(rectA, rectB) {
        const [minAx, minAy, maxAx, maxAy] = rectA
        const [minBx,  minBy,  maxBx,  maxBy] = rectB
        return maxAx >= minBx && minAx <= maxBx && minAy <= maxBy && maxAy >= minBy
    }

    writeToLogs(event) {
        this.logs.push(event)
        logger(event)
    }
    cleanLogs() {
        this.logs = []
    }

}

module.exports = Control