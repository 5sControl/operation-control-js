const {djangoDate} = require('./utils/Date')
const {bBox, isOperationOnWindow, withinWorkspace, whatSide} = require('./utils/2D')
const Report = require('./Report')
const {logger} = require("./Logger")

class Operation {

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

    report = new Report()

    check(buffer, window, full_w, empty_w, isHKKdetected, action) {
        this.buffer = buffer
        if (window) {
            this.window.bbox = window.bbox
            const [x, y, width, height] = this.window.bbox
            this.window.edgeCorners = [[x, y+height], [x+width, y+height]]
        }
        if (full_w && !this.startTracking) {
            // to Detector.isWindowDetected
            const WORKSPACE_BOUNDARIES = [1600, 900]
            if (!withinWorkspace(this.window.bbox, WORKSPACE_BOUNDARIES)) return
            this.isBeginTimer++
            logger(`Worker with window appeared: ${this.isBeginTimer}s`)
            if (this.isBeginTimer > 5) this.begin()
        }
        if (empty_w && this.startTracking && !this.stopTracking) {
            this.isEndTimer++
            logger(`Worker with window disappeared: ${this.isEndTimer}s`)
            if (this.isEndTimer > 5) this.end()
        }
        if (this.startTracking) this.isCornerProcessed(isHKKdetected, action)
    }

    async begin() {
        this.operationId = +new Date()
        this.startTracking = djangoDate(new Date())
        this.isBeginTimer = 0
        this.window.currentSide = "first"
        logger("Begin of operation")
        this.report.add(this.buffer, "Begin of operation")
    }
    async end() {
        this.operationId = null
        this.stopTracking = djangoDate(new Date())
        this.isEndTimer = 0

        this.processedSide = null
        this.timeFromLastProcessedCorner = 0
        this.hkkLast = null

        logger("End of operation")
        await this.report.add(this.buffer, "End of operation")

        this.report.send({
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
    async isCornerProcessed(isHKKdetected, action) {
        this.timeFromLastProcessedCorner++
        if (isHKKdetected) {
            // also 2D (is hkk-rect in wspace-rect)
            const [x, y] = bBox.getOrigin(action.bbox)
            // to Detector.isWindowDetected
            const WORKSPACE_BOUNDARIES = [1600, 900]
            if (x < WORKSPACE_BOUNDARIES[0] && y < WORKSPACE_BOUNDARIES[1]) {
                if (isOperationOnWindow(action.bbox, this.window.bbox)) {
                    this.hkkCounter++
                    this.hkkLast = action
                } else {
                    logger('hkk not on window!')
                }
            }
        } else {
            if (this.hkkCounter >= 1) {
                logger("Action performed")
                const currentSide = whatSide(this.hkkLast.bbox, this.window.edgeCorners)
                if (this.processedSide === null) {
                    logger("No side has been counted yet")
                    await this.addCleanedCorner(currentSide)
                } else {
                    logger("Some angle was counted")
                    if (currentSide === this.processedSide) {
                        logger(`It was the same corner (${this.processedSide})`)
                        if (this.timeFromLastProcessedCorner > 30) {
                            await this.addCleanedCorner(currentSide)
                            logger(`Same angle but more than 30 seconds`)
                        }
                    } else {
                        await this.addCleanedCorner(currentSide)
                        logger(`It was a different angle (${this.processedSide})`)
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

        logger("Corner processed")
        this.report.add(this.buffer, `${this.cornersProcessed} corner processed`, true, this.window.bbox, this.cornersState, this.window.currentSide)

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
}

module.exports = Operation