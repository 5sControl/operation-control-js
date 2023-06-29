const dispatcher = require('./Dispatcher')
dispatcher.emit("container started", `camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)
const {checkDirs} = require('./utils/Path')
const {YMD} = require('./utils/Date')
checkDirs(["images", process.env.folder, "debug/", "debug/operation-control", `debug/operation-control/${YMD(new Date())}`])

const Control = require("./Control")
new Control().start()