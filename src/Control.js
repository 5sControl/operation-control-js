const dispatcher = require('./Dispatcher')
const {djangoDate} = require('./utils/Date')
const {isOperationOnWindow, whatSide} = require('./utils/2D')

class Control {

    startTracking = null
    stopTracking = null

    isBeginTimer = 0
    isEndTimer = 0
    hkkCounter = 0

    window = {
        bbox: [], // Rect
        currentSide: "first", // "first", "second"
        cornersState: [false, false, false, false],
        cornersProcessed: 0,
        processedSide: null,
        timeFromLastProcessedCorner: 0,
        updateCornersState() {
            let i = null
            switch (this.currentSide) {
                case "first":
                    i = this.processedSide === "left" ? 0 : 1
                    break
                case "second":
                    i = this.processedSide === "left" ? 2 : 3
                    break
            }
            this.cornersState[i] = true
        },
        processCorner(processedSide) {
            this.cornersProcessed++
            this.processedSide = processedSide
            this.timeFromLastProcessedCorner = 0
            if (this.cornersProcessed === 3) this.currentSide = "second"
            this.updateCornersState()    
        }
    }

    action_detection = null

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

        this.window.processedSide = null
        this.window.timeFromLastProcessedCorner = 0
        this.action_detection = null

        dispatcher.emit("operation finished", {buffer: this.buffer, extra: {
            cornersProcessed: this.window.cornersProcessed,
            startTracking: this.startTracking,
            stopTracking: this.stopTracking,
            operationType: this.window.cornersProcessed === 0 ? "unknown" : "cleaning corners"
        }})

        this.window.cornersProcessed = 0
        this.window.cornersState = [false, false, false, false]
        this.startTracking = null
        this.stopTracking = null

    }
    async isCornerProcessed(action_detection) { // ActionDetection
        this.window.timeFromLastProcessedCorner++
        if (action_detection) {
            if (isOperationOnWindow(action_detection.bbox, this.window.bbox)) {
                this.hkkCounter++
                this.action_detection = action_detection
            } else {
                dispatcher.emit('hkk not on window!')
            }
        } else {
            if (this.hkkCounter >= 1) {
                dispatcher.emit("Action performed")
                const currentSide = whatSide(this.action_detection.bbox, this.window.bbox)
                if (this.window.processedSide === null) {
                    dispatcher.emit("No side has been counted yet")
                    await this.addCleanedCorner(currentSide)
                } else {
                    dispatcher.emit("Some angle was counted")
                    if (currentSide === this.window.processedSide) {
                        dispatcher.emit(`It was the same corner (${this.window.processedSide})`)
                        if (this.window.timeFromLastProcessedCorner > 30) {
                            await this.addCleanedCorner(currentSide)
                            dispatcher.emit(`Same angle but more than 30 seconds`)
                        }
                    } else {
                        await this.addCleanedCorner(currentSide)
                        dispatcher.emit(`It was a different angle (${this.window.processedSide})`)
                    }
                }
            }
            this.hkkCounter = 0
        }
    }
    async addCleanedCorner(processedSide) {
        this.window.processCorner(processedSide)
        dispatcher.emit("corner processed", {buffer: this.buffer, window: this.window})
    }

    checkBatch(detectionsBatch, buffersBatch) {
        buffersBatch.forEach((buffer, index) => this.check(buffer, detectionsBatch[index]))
    }

}

const control = new Control()
dispatcher.on("batch detections ready", async ({detectionsBatch, buffersBatch}) => control.checkBatch(detectionsBatch, buffersBatch))