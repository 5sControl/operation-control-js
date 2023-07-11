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
            dispatcher.emit("translation get null buffer")
            return null
        }
        if (buffer < 300000) {
            dispatcher.emit("translation get broken buffer", `buffer length is ${buffer.length} \n`)
            return null
        }
        if (buffer.length === this.buffer.current?.length) {
            dispatcher.emit("translation get same buffer")
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
                dispatcher.emit("translation updated", false, this.buffer.current)
            }
        } catch (error) {
            dispatcher.emit("translation update error", error)
        }
    }
    constructor() {
        if (!process.env.isDebugger) setInterval(() => this.update(), 1000)
    }

}

const translation = new Translation()

module.exports = translation