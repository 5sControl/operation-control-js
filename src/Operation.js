const dispatcher = require('./Dispatcher')
const {djangoDate} = require('./utils/Date')
const {isOperationOnWindow, whatSide} = require('./utils/2D')

class Operation {

    // operation
    startTracking = null
    stopTracking = null
    cornersProcessed = 0
    // counters
    isBeginTimer = 0
    isEndTimer = 0

    window = {
        bbox: [], // Rect
        currentSide: "first", // "first", "second"
        cornersState: [false, false, false, false]
    }
    processedSide = null
    timeFromLastProcessedCorner = 0

    hkkCounter = 0
    hkkLast = null

    check(buffer, { window_detection, detect_window_and_worker, detect_nothing, action_detection }) {
        this.buffer = buffer
        if (window_detection) this.window.bbox = window_detection.bbox
        if (detect_window_and_worker && !this.startTracking) {
            this.isBeginTimer++
            dispatcher.emit(`Worker with window appeared: ${this.isBeginTimer}s`)
            if (this.isBeginTimer > 5) this.begin()
        }
        if (detect_nothing && this.startTracking && !this.stopTracking) {
            this.isEndTimer++
            dispatcher.emit(`Worker with window disappeared: ${this.isEndTimer}s`)
            if (this.isEndTimer > 5) this.end()
        }
        if (this.startTracking) this.isCornerProcessed(action_detection)
    }

    async begin() {
        this.startTracking = djangoDate(new Date())
        this.isBeginTimer = 0
        this.window.currentSide = "first"
        dispatcher.emit("operation started", {buffer: this.buffer})
    }
    async end() {

        this.stopTracking = djangoDate(new Date())
        this.isEndTimer = 0

        this.processedSide = null
        this.timeFromLastProcessedCorner = 0
        this.hkkLast = null

        dispatcher.emit("operation finished", {buffer: this.buffer, extra: {
            cornersProcessed: this.cornersProcessed,
            startTracking: this.startTracking,
            stopTracking: this.stopTracking,
            operationType: this.cornersProcessed === 0 ? "unknown" : "cleaning corners"
        }})

        this.cornersProcessed = 0
        this.window.cornersState = [false, false, false, false]
        this.startTracking = null
        this.stopTracking = null

    }
    async isCornerProcessed(action_detection) { // ActionDetection
        this.timeFromLastProcessedCorner++
        if (action_detection) {
            if (isOperationOnWindow(action_detection.bbox, this.window.bbox)) {
                this.hkkCounter++
                this.hkkLast = action_detection
            } else {
                dispatcher.emit('hkk not on window!')
            }
        } else {
            if (this.hkkCounter >= 1) {
                dispatcher.emit("Action performed")
                const currentSide = whatSide(this.hkkLast.bbox, this.window.bbox)
                if (this.processedSide === null) {
                    dispatcher.emit("No side has been counted yet")
                    await this.addCleanedCorner(currentSide)
                } else {
                    dispatcher.emit("Some angle was counted")
                    if (currentSide === this.processedSide) {
                        dispatcher.emit(`It was the same corner (${this.processedSide})`)
                        if (this.timeFromLastProcessedCorner > 30) {
                            await this.addCleanedCorner(currentSide)
                            dispatcher.emit(`Same angle but more than 30 seconds`)
                        }
                    } else {
                        await this.addCleanedCorner(currentSide)
                        dispatcher.emit(`It was a different angle (${this.processedSide})`)
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
        dispatcher.emit("corner processed", {buffer: this.buffer, cornersProcessed: this.cornersProcessed, window: this.window})
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
        this.window.cornersState[i] = true
    }
}

const operation = new Operation()

module.exports = operation