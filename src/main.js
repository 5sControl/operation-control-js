const {djangoDate} = require('./modules/utils')
const {logger} = require("./modules/Logger")
logger("container started",`
Container started at ${djangoDate(new Date())}:
camera_url: ${process.env.camera_url}
folder: ${process.env.folder}
server_url: ${process.env.server_url}
`)

const Control = require("./modules/Control")
const run = async () => {
    await new Control().start()
    logger("control started")
}
run()