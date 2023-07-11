const {EventEmitter} = require('events')
const {logger} = require('./Logger')

class Dispatcher extends EventEmitter {
    emit(event, options) {
        super.emit(event, options)
        if (!options?.notForConsole) logger(event, options?.message)
    }
}

const dispatcher = new Dispatcher()

module.exports = dispatcher