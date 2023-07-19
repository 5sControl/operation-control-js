const db = require("./DB")
const Drawer = require("./Report/Drawer")

dispatcher.on("container started", async () => {
    const record = {
        id: process.env.launch,
        envs: { WORKSPACE_ZONE: global.WORKSPACE_ZONE },
        is_test
    }
    db.insert("launches", record)
})

dispatcher.on("snapshot checked", async ({snapshot}) => {
    const {launch, index, received, detections} = snapshot
    const record = {launch, index, received, detections}
    db.insert("timeline", record)
    const compressed_buffer = await new Drawer(snapshot.buffer).compress()
    snapshot.buffer = compressed_buffer
    db.upload(snapshot)
})