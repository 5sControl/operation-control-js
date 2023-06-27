const {EventEmitter} = require('events')
const {logger} = require('./Logger')

class Dispatcher extends EventEmitter {
    emit(event) {
        super.emit(event)
        logger(event)
    }
}

module.exports = new Dispatcher()