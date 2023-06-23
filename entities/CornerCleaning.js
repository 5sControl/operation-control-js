const {djangoDate, bBox, isExists} = require('../utils')
const {Control} = require('./Control')
const Snapshot = require('./Snapshot')

const EVENTS = [
    "Begin of operation",
    "Corner processed by hkk",
    "End of operation"
]

class CornerCleaning extends Control {

    // operation
    operationId = null
    startTracking = null
    stopTracking = null
    cornersProcessed = 0

    WORKSPACE_BOUNDARIES = [1600, 900]
    HKK_MIN_SCORE = 0.9

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
    isLocalDebug = false

    hkkCounter = 0
    hkkLast = null

    logs = []

    constructor(...args) {
        super(...args)
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

        // operation.sendToReports
        this.sendReport({ 
            cornersProcessed: this.cornersProcessed,
            startTracking: this.startTracking,
            stopTracking: this.stopTracking,
            operationType: this.cornersProcessed === 0 ? "unknown" : "cleaning corners"
        })
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
                this.writeToLogs("Operation found", false) // Найдена операция
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
    withinWorkspace(bbox) { // refactor[2D]: rect in another rect
        const [x, y, width, height] = bbox
        return x < this.WORKSPACE_BOUNDARIES[0] && y < this.WORKSPACE_BOUNDARIES[1] ? true : false
    }

    writeToLogs(event, showAtConsole = true) {
        this.logs.push(event)
        if (showAtConsole) console.log(this.debugColor, event)
    }
    cleanLogs() {
        this.logs = []
    }

    static getVersion() {
        return {
            name: "Operation Control",
            version: "v1.0.0-rc.3",
            date: '21.06.2023',
            description: 'Designed to ensure that the necessary number of operations are executed while cleaning seams during production.' +
                ' This type of control helps to streamline the process and prevent any errors or omissions that could lead to costly production delays. ',
        }
    }
    
}

module.exports = CornerCleaning