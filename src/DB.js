const { supabase } = require("./supabaseClient.js")

const db = {
    async insert(table, record) {
        const { data, error } = await supabase
        .from(table)
        .insert([record])
        .select()
        console.log("container started event saved", "data:", data, "error:", error)
    }
}

module.exports = db