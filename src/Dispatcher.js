const {EventEmitter} = require('events')
const {logger} = require('./Logger')
const {YMD, HMS} = require('./utils/Date')
const {checkDirs} = require('./utils/Path')

class Dispatcher extends EventEmitter {
    emit(event, ...payload) {
        super.emit(event, ...payload)
        if (payload[0] !== false) logger(event, ...payload)
    }
}

const dispatcher = new Dispatcher()

dispatcher.on("operation started", () => {
    process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}/${HMS(new Date())}`
    checkDirs(process.env.currentDebugFolder)
})
dispatcher.on("operation finished", () => {
    setTimeout(() => {
        process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
    }, 1000)
})

module.exports = dispatcher