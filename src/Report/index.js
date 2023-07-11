const fs = require('fs')
const crypto = require('crypto')
const dispatcher = require('../Dispatcher')
const Drawer = require('./Drawer')
const {djangoDate} = require('../utils/Date')

class Report {

    photos = []
    async add(buffer, eventName, window) {
        let drawedBuffer = await new Drawer(buffer, eventName).draw(window)
        const imagePath = this.upload(drawedBuffer)
        const photoRecord = {"image": imagePath, "date": djangoDate(new Date())}
        this.photos.push(photoRecord)
    }
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
    }
    send(extra) {
        const json = {
            "algorithm": "operation_control",
            "camera": process.env.folder?.split("/")[1],
            "start_tracking": this.photos[0].date,
            "stop_tracking": this.photos[this.photos.length - 1].date,
            "photos": this.photos,
            "violation_found": extra.cornersProcessed !== 4,
            "extra": extra
        }
        const body = JSON.stringify(json, null, 2)
        fetch(`${process.env.server_url}:80/api/reports/report-with-photos/`, {
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

    constructor() {
        dispatcher.on("operation started", ({buffer}) => this.add(buffer, "operation started"))
        dispatcher.on("operation finished", async ({buffer, extra}) => {
            await this.add(buffer, "operation finished")
            this.send(extra)
        })
        dispatcher.on("corner processed", async ({buffer, cornersProcessed, window}) => {
            this.add(buffer, `${cornersProcessed} corner processed`, window)
        })
    }

}

const report = new Report()

module.exports = Report