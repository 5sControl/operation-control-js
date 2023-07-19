const {YMD, HMS} = require('./utils/Date')
const {checkDirs} = require('./utils/Path')
global.dispatcher = require('./Dispatcher')

process.env.N_CPUS = require('os').cpus().length
process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
global.WORKSPACE_ZONE = [280, 0, 1200, 900]
checkDirs([process.env.folder, process.env.currentDebugFolder])
process.env.launch = `${YMD(new Date())}_${HMS(new Date())}`
global.is_test = process.env.is_test ? true : false

require('./Debugger')
require('./Detector')
require('./Machine')
require('./Report')
require('./Batch')
require('./Translation')

dispatcher.emit("container started", { message: `
launch: ${process.env.launch}
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
currentDebugFolder: ${process.env.currentDebugFolder}
N_CPUS: ${process.env.N_CPUS}
socket_server: ${process.env.socket_server}
`
})