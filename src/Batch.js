const dispatcher = require('./Dispatcher')

let batch = []

dispatcher.on("new snapshot received", ({snapshot}) => {
    batch.push(snapshot)
    if (batch.length === +process.env.N_CPUS) {
        const batchCopy = [...batch]
        batch = []
        dispatcher.emit("batch ready", {batch: batchCopy})
    }
})