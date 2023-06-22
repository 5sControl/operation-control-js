const Camera = require('./entities/Camera')
const CornerCleaning = require("./entities/controls/CornerCleaning")

const {camera_url, folder, server_url} = process.env

const run = async () => {
    const camera = new Camera()
    const reqBody = {algorithm: 'operation_control', camera_url, server_url, extra: []}
    const cameraInterval = await camera.init(reqBody, false, folder)
    const createdAlgorithm = new CornerCleaning(cameraInterval.camera, 'operation_control', [])
    await createdAlgorithm.start(cameraInterval.camera)
}
run()