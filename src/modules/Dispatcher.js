const {EventEmitter} = require('events')
const {logger} = require('./Logger')

class Dispatcher extends EventEmitter {
    emit(event, payload) {
        super.emit(event)
        if (payload !== false) logger(event, payload)
    }
}

module.exports = new Dispatcher()