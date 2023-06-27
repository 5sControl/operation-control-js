const dispatcher = require('./Dispatcher')

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

    async getSnapshot() {
        try {
            if (process.env.isLocalDebug) {
                const fs = require('fs')
                this.snapshot.buffer.current = fs.readFileSync('debug/snapshot.jpeg')
            } else {
                const response = await fetch(process.env.camera_url)
                console.log(response)
                this.snapshot.buffer.current = response
            }
            if (!this.snapshot.isExist()) {dispatcher.emit("snapshot null"); return}
            if (!this.snapshot.isAnother()) {dispatcher.emit("snapshot same"); return}
            if (!this.snapshot.isCorrect()) {dispatcher.emit("snapshot broken"); return}
            this.snapshot.saveLastLength()
            dispatcher.emit("snapshot updated", false)
            return this.snapshot.buffer
        } catch (error) {
            dispatcher.emit("snapshot update error", error)
        }
    }

}

module.exports = Camera