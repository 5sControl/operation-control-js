const Camera = require('./entities/Camera')
const CornerCleaning = require("./entities/controls/CornerCleaning")

const camera_url = process.env.camera_url || "http://192.168.1.110:3456/onvif-http/snapshot?Profile_1"
const folder = process.env.folder || "images/192.168.1.110"
const server_url = process.env.server_url || "http://192.168.1.110"

const run = async () => {
    const camera = new Camera()
    const reqBody = {algorithm: 'operation_control', camera_url, server_url, extra: []}
    const cameraInterval = await camera.init(reqBody, false, folder)
    const createdAlgorithm = new CornerCleaning(cameraInterval.camera, 'operation_control', [])
    await createdAlgorithm.start(cameraInterval.camera)
}
run()