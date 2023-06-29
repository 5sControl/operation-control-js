const {EventEmitter} = require('events')
const {logger} = require('./Logger')
const {YMD, HMS} = require('./utils/Date')
const {isExists} = require('./utils/Path')

class Dispatcher extends EventEmitter {
    emit(event, payload) {
        super.emit(event)
        if (payload !== false) logger(event, payload)
    }
}

const dispatcher = new Dispatcher()

dispatcher.on("Begin of operation", () => {
    process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}/${HMS(new Date())}`
    isExists(process.env.currentDebugFolder)
})
dispatcher.on("End of operation", () => {
    setTimeout(() => {
        process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
    }, 1000)
})

module.exports = dispatcher