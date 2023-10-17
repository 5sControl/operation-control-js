const fs = require('fs')
const crypto = require('crypto')
const Drawer = require('./Drawer')
const {djangoDate} = require('../utils/Date')

const report = {
    photos: [],
    async add(buffer, eventName, window) {
    // async add(snapshot) {
        let drawedBuffer = await new Drawer(buffer, eventName).draw(window)
        // let drawedBuffer = await new Drawer(snapshot.buffer).draw_detections(snapshot.detections)
        const imagePath = this.upload(drawedBuffer)
        // const photoRecord = {"image": imagePath, "date": djangoDate(new Date(snapshot.received))}
        const photoRecord = {"image": imagePath, "date": djangoDate(new Date())}
        this.photos.push(photoRecord)
    },
    /**
     * @param {Buffer} buffer from Drawer
     * @returns {string} imagePath
     */
    upload(buffer) {
        const imagePath = `${process.env.folder}/${crypto.randomUUID()}.jpeg`
        fs.writeFile(
            imagePath,
            buffer,
            error => { if (error) console.log(error) }
        )
        return imagePath
    },
    send(extra) {
        const json = {
            "algorithm": process.env.algorithm_name || "operation_control",
            "camera": process.env.folder?.split("/")[1],
            "start_tracking": this.photos[0].date,
            "stop_tracking": this.photos[this.photos.length - 1].date,
            "photos": this.photos,
            "violation_found": extra.cornersProcessed !== 4,
            "extra": extra
        }
        const body = JSON.stringify(json, null, 2)
        console.log(body)
        fetch(`http://${process.env.link_reports}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { dispatcher.emit("server response", {message: response}) })
        .catch(err => { dispatcher.emit("error report send", {message: err.code}) })
        dispatcher.emit("report sended", {message: `corners: ${json.extra.cornersProcessed}\njson: ${body}\n\n`})
        this.photos = []
    }
}

dispatcher.on("operation started", ({buffer}) => report.add(buffer, "operation started"))
dispatcher.on("operation finished", async ({buffer, extra}) => {
    await report.add(buffer, "operation finished")
    report.send(extra)
})
dispatcher.on("corner processed", async ({buffer, window}) => report.add(buffer, `${window.cornersProcessed} corner processed`, window))
dispatcher.on("machine: report", async ({snapshots_for_report}) => {
    console.log("64", snapshots_for_report)
    for (const snapshot of snapshots_for_report) {
        await report.add(snapshot)
    }
    report.send({"operationType": "unknown"})
})