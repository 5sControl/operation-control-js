const dispatcher = require('./Dispatcher')
const fs = require('fs')

class Translation {

    buffer = {
        current: null,
        previous: {
            length: 0
        }
    }
    saveLastLength() {
        this.buffer.previous.length = this.buffer.current?.length
    }
    isExist() {
        return this.buffer.current !== null
    }
    isAnother() {
        return this.buffer.current.length !== this.buffer.previous.length
    }
    isCorrect() {
        return this.buffer.current.length > 300000
    }

    async update(bufferFromGer) {
        try {
            if (bufferFromGer) {
                this.buffer.current = bufferFromGer
            } else {                
                const response = await fetch(process.env.camera_url)
                const arrayBuffer = await response.arrayBuffer()
                this.buffer.current = Buffer.from(arrayBuffer)
            }

            // snapshot.check()
            if (!this.isExist()) {
                dispatcher.emit("snapshot null"); 
                return null
            }
            if (!this.isCorrect()) {
                dispatcher.emit("snapshot broken", `buffer length is ${this.buffer.current.length} \n`); 
                return null
            }
            if (!this.isAnother()) {
                dispatcher.emit("snapshot same"); 
                return null
            }

            this.saveLastLength()
            // this.recordSnapshot(this.buffer.current)
            dispatcher.emit("snapshot updated", false, this.buffer.current)
        } catch (error) {
            dispatcher.emit("snapshot update error", error)
        }
    }
    isRecording = false
    recordedSnapshots = 0
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

    constructor() {
        dispatcher.on("operation started", () => this.isRecording = true)
        dispatcher.on("operation finished", () => this.isRecording = false)
        if (!process.env.isDebugger) setInterval(() => this.update(), 1000)
    }

}

const translation = new Translation()

module.exports = translation