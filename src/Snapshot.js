const { supabase } = require("./supabaseClient.js")

class Snapshot {
    constructor(buffer, index) {
        this.buffer = buffer
        this.received = new Date()
        this.index = index.toString()
        this.detections = []
        this.events = []
    }
    async upload() {
        const { data, error } = await supabase.storage
        .from("snapshots").upload(`${this.index}.jpeg`, this.buffer, {upsert: true})
        if (error) {
            console.log(error)
        } else {
            console.log("snapshot buffer saved", data)
        }
    }
    async insert() {
        const {received, index, detections, events} = this
        const { data, error } = await supabase
        .from("timeline")
        .insert([{received, index, detections, events}])
        .select()
        console.log("snapshot record saved", data, error)
    }
    saveToDb() {
        this.insert()
        this.upload()
    }
}

module.exports = Snapshot