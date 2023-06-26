logger("container started",`
Container started at ${djangoDate(new Date())}:
camera_url: ${camera_url}
folder: ${folder}
server_url: ${server_url}
`)

const {djangoDate, isExists} = require('./modules/utils')
const {logger} = require("./modules/Logger")
const Camera = require('./modules/Camera')
const CornerCleaning = require("./modules/CornerCleaning")

const camera_url = process.env.camera_url || "http://192.168.1.110:3456/onvif-http/snapshot?Profile_1"
const folder = process.env.folder || "images/192.168.1.110"
const server_url = process.env.server_url || "http://192.168.1.110"

// checkDirs
isExists("images")
isExists(folder)
isExists("debug/")
isExists("debug/operation-control")

const run = async () => {
    const camera = new Camera(camera_url)
    await new CornerCleaning(camera).start()
    logger("control started")
}
run()