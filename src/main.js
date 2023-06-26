const {logger} = require("./modules/Logger")
logger("container started",`camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)

const {checkDirs} = require('./modules/utils/Path')
checkDirs(["images", process.env.folder, "debug/", "debug/operation-control"])

const Control = require("./modules/Control")
new Control().start().then(() => logger("control started"))