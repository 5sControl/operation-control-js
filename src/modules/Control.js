const {logger} = require("./Logger")
const {djangoDate} = require('./utils/Date')

const Camera = require('./Camera')
const Detector = require('./Detector')

const {bBox, isOperationOnWindow, withinWorkspace, whatSide} = require('./utils/2D')

const Snapshot = require('./Snapshot')
const Report = require('./Report')

const EVENTS = [
    "Begin of operation",
    "Corner processed",
    "End of operation"
]

class Control {

    camera = new Camera(process.env.camera_url)

    detector = new Detector()
    WORKSPACE_BOUNDARIES = [1600, 900]

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

    hkkCounter = 0
    hkkLast = null

    logs = []

    photosForReport = []

    constructor() {}

    async start(isWithTimer = true) {
        await this.detector.loadModels()
        if (isWithTimer) setInterval(() => this.check(), 1000)
    }

    async check(bufferFromGer) {

        if (bufferFromGer) {
            this.camera.snapshot.buffer = bufferFromGer
        } else {
            await this.camera.getSnapshot()
            if (!this.camera.snapshot.buffer) return
            if (this.camera.snapshot.buffer.length < 1000) {
                logger("translation broken", `buffer length is ${buffer.length} \n`)
                return
            }
            if (this.camera.isVideoStreamOnPause()) return
        }

        await this.detector.getPredictions(this.camera.snapshot.buffer)

        this.cleanLogs()
        this.status()
        if (this.startTracking) this.isCornerProcessed()
    }

    status() {
        // Control.isAnyDetections([], "set")
        let detectClasses = new Set()
        for (const detection of this.detector.isAnyDetections()) detectClasses.add(detection.class)

        // update this.window and this.worker
        const window = this.detector.predictions.w?.find(detection => detection.class === "window" && detection.score > 0.5)
        if (window) {
            this.window.bbox = window.bbox
            const [x, y, width, height] = this.window.bbox
            this.window.edgeCorners = [[x, y+height], [x+width, y+height]]
        }
        let full_w = detectClasses.has("window") && detectClasses.has("worker")
        let empty_w = !detectClasses.has("window") && !detectClasses.has("worker")

        if (full_w && !this.startTracking) {
            if (!withinWorkspace(this.window.bbox, this.WORKSPACE_BOUNDARIES)) return
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
        let isHKKdetected = this.detector.isAnyDetections(["hkk"], "boolean", 0.9)
        if (isHKKdetected) {
            // also 2D (is hkk-rect in wspace-rect)
            const [x, y] = bBox.getOrigin(this.detector.predictions.o[0].bbox)
            if (x < this.WORKSPACE_BOUNDARIES[0] && y < this.WORKSPACE_BOUNDARIES[1]) {
                if (isOperationOnWindow(this.detector.predictions.o[0].bbox, this.window.bbox)) {
                    this.hkkCounter++
                    this.hkkLast = this.detector.predictions.o[0]
                } else {
                    this.writeToLogs('hkk not on window!')
                }
            }
        } else {
            if (this.hkkCounter >= 1) {
                this.writeToLogs("Action performed", false) // Найдена операция
                const currentSide = whatSide(this.hkkLast.bbox, this.window.edgeCorners)
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

    writeToLogs(event) {
        this.logs.push(event)
        logger(event)
    }
    cleanLogs() {
        this.logs = []
    }

}

module.exports = Control