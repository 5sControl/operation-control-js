const {YMD} = require('./utils/Date')
const {checkDirs} = require('./utils/Path')
const dispatcher = require('./Dispatcher')

process.env.N_CPUS = require('os').cpus().length
process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
checkDirs([process.env.folder, process.env.currentDebugFolder])

const detector = require('./Detector')
const operation = require('./Operation')
const translation = require('./Translation')
require('./Report')

dispatcher.emit("container started", { message: `
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
currentDebugFolder: ${process.env.currentDebugFolder}
N_CPUS: ${process.env.N_CPUS}
`
})

dispatcher.on("translation updated", async ({buffer}) => {
    const detections = await detector.detect(buffer)
    operation.check(buffer, detections)
})

module.exports = {translation}