const dispatcher = require('./Dispatcher')

let batch = []

dispatcher.on("translation updated", ({buffer}) => {
    batch.push(buffer)    
    if (batch.length === +process.env.N_CPUS) {
        const batchCopy = [...batch]
        batch = []
        dispatcher.emit("batch ready", {batch: batchCopy})
    }
})