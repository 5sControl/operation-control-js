require('./globals')
// require('./Debugger')
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