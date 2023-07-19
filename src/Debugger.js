const db = require("./DB")

dispatcher.on("container started", async () => {
    const record = {
        id: process.env.launch,
        envs: { WORKSPACE_ZONE: global.WORKSPACE_ZONE },
        is_test
    }
    db.insert("launches", record)
})

dispatcher.on("snapshot checked", ({snapshot}) => {
    const {launch, index, received, detections} = snapshot
    const record = {launch, index, received, detections}
    db.insert("timeline", record)
    // const snapshot.buffer = (640px and 40%)
    db.upload(snapshot)
})