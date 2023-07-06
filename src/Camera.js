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
            // console.log("\nold, new buffers:", this.buffer.previous.length, this.buffer.current?.length)
            this.buffer.previous.length = this.buffer.current?.length
        },
        isExist() {
            return this.buffer.current !== null
        },
        isAnother() {
            return this.buffer.current.length !== this.buffer.previous.length
        },
        isCorrect() {
            return this.buffer.current.length > 300000
        }
    }

    isRecording = false
    recordedSnapshots = 0
    constructor() {
        dispatcher.on("Begin of operation", () => this.isRecording = true)
        dispatcher.on("End of operation", () => this.isRecording = false)
        // dispatcher.on("tick completed", () => {this.recordSnapshot()})
    }

    async getSnapshot(bufferFromGer) {
        try {
            if (bufferFromGer) {
                this.snapshot.buffer.current = bufferFromGer
            } else {                
                const response = await fetch(process.env.camera_url)
                const arrayBuffer = await response.arrayBuffer()
                this.snapshot.buffer.current = Buffer.from(arrayBuffer)
            }
            if (!this.snapshot.isExist()) {dispatcher.emit("snapshot null"); return null}
            if (!this.snapshot.isCorrect()) {dispatcher.emit("snapshot broken", `buffer length is ${this.snapshot.buffer.current.length} \n`); return null}
            if (!this.snapshot.isAnother()) {dispatcher.emit("snapshot same"); return null}
            dispatcher.emit("snapshot updated", false)
            this.snapshot.saveLastLength()
            this.recordSnapshot(this.snapshot.buffer.current)
            return this.snapshot.buffer.current
        } catch (error) {
            dispatcher.emit("snapshot update error", error)
        }
    }

    recordSnapshot(buffer) {
        if (this.recordedSnapshots < 300 && this.isRecording) {
            this.recordedSnapshots++
            fs.writeFile(`${process.env.currentDebugFolder + "/snapshots"}/${this.recordedSnapshots}.jpeg`, buffer, error => {
                if (error) console.log(error)
            })
        } else {
            this.recordedSnapshots = 0
            this.isRecording = false
        }
    }

}

module.exports = Camera