const { supabase } = require("./supabaseClient.js")

const db = {
    async insert(table, record) {
        const { data, error } = await supabase
        .from(table)
        .insert([record])
        .select()
        console.log("record was inserted to:", table, "record:", data, "error:", error)
    },
    async upload(snapshot) {
        const { data, error } = await supabase.storage
        .from("snapshots").upload(`${snapshot.launch}/${snapshot.index}.jpeg`, snapshot.compressed_buffer, {upsert: true})
        if (error) {
            console.log(error)
        } else {
            console.log("snapshot buffer saved", data)
        }
    }
}

module.exports = db