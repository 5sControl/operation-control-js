const dispatcher = require('./Dispatcher')
const fs = require('fs')

class Camera {

    snapshot = {
        buffer: {
            current: null,
            previous: {
                length: 0
            },
        },
        saveLastLength() {
            this.buffer.previous.length = this.buffer.current?.length
        },
        isExist() {
            return this.buffer.current !== null
        },
        isAnother() {
            return this.buffer.current.length === this.buffer.previous.length
        },
        isCorrect() {
            return this.buffer.current.length > 300
        }
    }

    isRecording = false
    recordedSnapshots = 0
    constructor() {
        dispatcher.on("Begin of operation", () => this.isRecording = true)
        dispatcher.on("End of operation", () => this.isRecording = false)
        dispatcher.on("tick completed", () => {this.recordSnapshot()})
    }

    async getSnapshot() {
        try {
            // this.snapshot.saveLastLength()
            const response = await fetch(process.env.camera_url)
            console.log(response)
            this.snapshot.buffer.current = response
            if (!this.snapshot.isExist()) {dispatcher.emit("snapshot null"); return}
            if (!this.snapshot.isCorrect()) {dispatcher.emit("snapshot broken", `buffer length is ${this.snapshot.buffer.current.length} \n`); return}
            // if (this.snapshot.isAnother()) {dispatcher.emit("snapshot same"); return}
            dispatcher.emit("snapshot updated", false)
            return this.snapshot.buffer.current
        } catch (error) {
            dispatcher.emit("snapshot update error", error)
        }
    }

    recordSnapshot() {
        if (this.recordedSnapshots < 300 && this.isRecording) {
            this.recordedSnapshots++
            fs.writeFile(`${process.env.currentDebugFolder + "/snapshots"}/${this.recordedSnapshots}.jpeg`, this.snapshot.buffer.current, error => {
                if (error) console.log(error)
            })
        } else {
            this.recordedSnapshots = 0
            this.isRecording = false
        }
    }

}

module.exports = Camera