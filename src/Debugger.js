const db = require("./DB")

dispatcher.on("container started", async () => {
    const record = {
        id: process.env.launch,
        envs: { WORKSPACE_ZONE: global.WORKSPACE_ZONE }
    }
    db.insert("launches", record)
})

dispatcher.on("snapshot checked", ({snapshot}) => {
    console.log(snapshot.index)
})