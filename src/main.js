const {YMD} = require('./utils/Date')
const {checkDirs} = require('./utils/Path')
global.dispatcher = require('./Dispatcher')

process.env.N_CPUS = require('os').cpus().length
process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
global.WORKSPACE_ZONE = [280, 0, 1200, 900]
checkDirs([process.env.folder, process.env.currentDebugFolder])

require('./Detector')
require('./Machine')
require('./Report')
require('./Batch')
require('./Translation')

dispatcher.emit("container started", { message: `
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
currentDebugFolder: ${process.env.currentDebugFolder}
N_CPUS: ${process.env.N_CPUS}
socket_server: ${process.env.socket_server}
`
})