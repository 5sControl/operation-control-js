const {YMD} = require('./utils/Date')
process.env.currentDebugFolder = `debug/operation-control/${YMD(new Date())}`
const {checkDirs} = require('./utils/Path')
checkDirs([process.env.folder, process.env.currentDebugFolder])

const dispatcher = require('./Dispatcher')
dispatcher.emit("container started", `camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)

const Control = require("./Control")
new Control().start()