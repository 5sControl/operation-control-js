const dispatcher = require('./Dispatcher')

class Translation {

    buffer = {
        current: null,
        previous: {
            length: 0
        },
        saveLastLength() {
            this.previous.length = this.current?.length
        }
    }
    check(buffer) {
        if (buffer === null) {
            dispatcher.emit("snapshot null")
            return null
        }
        if (buffer < 300000) {
            dispatcher.emit("snapshot broken", `buffer length is ${buffer.length} \n`)
            return null
        }
        if (buffer.length === this.buffer.current?.length) {
            dispatcher.emit("snapshot same")
            return null
        }
        return buffer
    }
    async update(bufferFromGer) {
        try {
            let receivedBuffer
            if (bufferFromGer) {
                receivedBuffer = bufferFromGer
            } else {
                const response = await fetch(process.env.camera_url)
                const arrayBuffer = await response.arrayBuffer()
                receivedBuffer = Buffer.from(arrayBuffer)
            }
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                dispatcher.emit("snapshot updated", false, this.buffer.current)
            }
        } catch (error) {
            dispatcher.emit("snapshot update error", error)
        }
    }
    constructor() {
        if (!process.env.isDebugger) setInterval(() => this.update(), 1000)
    }

}

const translation = new Translation()

module.exports = translation