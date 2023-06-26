const {djangoDate, checkDirs} = require('./modules/utils')

const {logger} = require("./modules/Logger")
logger("container started",`
Container started at ${djangoDate(new Date())}:
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)
checkDirs(["images", process.env.folder, "debug/", "debug/operation-control"])

const Control = require("./modules/Control")
new Control().start().then(() => logger("control started"))