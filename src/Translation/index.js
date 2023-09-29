const io = require('socket.io-client')
const socketURL = process.env.socket_server || "http://172.16.101.100:3456"
const socket = io(socketURL)
const Snapshot = require('./Snapshot.js')

class Translation {

    index = 0

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
        if (buffer.length < 300000) {
            dispatcher.emit("translation get broken buffer", {message: `buffer length is ${buffer.length} \n`})
            return null
        }
        if (buffer.length === this.buffer.current?.length) {
            dispatcher.emit("translation get same buffer")
            return null
        }
        return buffer
    }
    async update(receivedBuffer) {
        try {
            const checkedBuffer = this.check(receivedBuffer)
            if (checkedBuffer) {
                this.buffer.saveLastLength()
                this.buffer.current = checkedBuffer
                this.index++
                const snapshot = new Snapshot(checkedBuffer, this.index)
                dispatcher.emit("new snapshot received", { notForConsole: true, snapshot })
            }
        } catch (error) {
            dispatcher.emit("translation update error", { message: error })
        }
    }
    constructor() {
        socket.on("connect", async () => {
            console.log(`Connected to the socket server: ${socketURL}`)
            socket.on("snapshot_updated", async ({screenshot}) => this.update(screenshot))
        })
    }

}
new Translation()
// require('./Batch')