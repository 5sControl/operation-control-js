const {EventEmitter} = require('events')
const {logger} = require('./Logger')

class Dispatcher extends EventEmitter {
    emit(event, ...payload) {
        super.emit(event, ...payload)
        if (payload[0] !== false) logger(event, ...payload)
    }
}

const dispatcher = new Dispatcher()

module.exports = dispatcher