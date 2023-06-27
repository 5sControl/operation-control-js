const dispatcher = require('./Dispatcher')
dispatcher.emit("container started", `camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)

const {checkDirs} = require('./utils/Path')
checkDirs(["images", process.env.folder, "debug/", "debug/operation-control"])

const Control = require("./Control")
new Control().start()