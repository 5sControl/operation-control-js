const {YMD} = require('./utils/Date')
const {checkDirs} = require('./utils/Path')
const dispatcher = require('./Dispatcher')

process.env.N_CPUS = require('os').cpus().length
process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`

checkDirs([process.env.folder, process.env.currentDebugFolder])

const detector = require('./Detector')
const operation = require('./Operation')
const translation = require('./Translation')

dispatcher.emit("container started", `camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
currentDebugFolder: ${process.env.currentDebugFolder}
N_CPUS: ${process.env.N_CPUS}
`)

// let batch = []
dispatcher.on("translation updated", async (_, buffer) => {
    const detections = await detector.detect(buffer)
    operation.check(buffer, detections)
    //     this.batch.push(checkBuffer)
    //     if (this.batch.length === +process.env.N_CPUS) {
    //         console.log("detect batch")
    //         const batchCopy = [...this.batch]
    //         this.batch = []
    //         const result = this.detector.detectBatch(batchCopy)
    //         console.log(result)
    //         // this.operation.check(checkBuffer, detections)
    //     }
})

module.exports = {translation}