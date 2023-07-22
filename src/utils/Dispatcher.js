const {EventEmitter} = require('events')
const {Timestamp} = require('./Date')

class Dispatcher extends EventEmitter {
    emit(eventName, options) {
        super.emit(eventName, options)
        if (!options?.notForConsole) {
            const message = options?.message
            const record = `${Timestamp()}: ${eventName}${message ? `\n${message}` : "" }`
            console.log(`\x1b[34m%s\x1b[0m`, record)        
        }
    }
}

const dispatcher = new Dispatcher()

module.exports = dispatcher