const fs = require('fs')
const crypto = require('crypto')
const dispatcher = require('./Dispatcher')
const Drawer = require('./Drawer')
const {djangoDate} = require('./utils/Date')

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
    send(controlPayload) {
        
        const json = {
            "algorithm": "operation_control",
            "camera": process.env.folder?.split("/")[1] || undefined,
            "start_tracking": this.photos[0].date,
            "stop_tracking": this.photos[this.photos.length - 1].date,
            "photos": this.photos,
            "violation_found": controlPayload.cornersProcessed !== 4,
            "extra": controlPayload
        }
        
        const body = JSON.stringify(json, null, 2)
        fetch(`${process.env.server_url}:80/api/reports/report-with-photos/`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { dispatcher.emit("server response", response) })
        .catch(err => { dispatcher.emit("error report send", err.code) })
        dispatcher.emit("report sended",
        `corners: ${json.extra.cornersProcessed}\njson: ${body}\n\n`)

        this.photos = []

    }

}

module.exports = Report