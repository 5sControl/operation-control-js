const fs = require('fs')
const crypto = require('crypto')
const {logger} = require("./Logger")
const Snapshot = require('./Snapshot')
const {djangoDate} = require('./utils/Date')

class Report {

    photos = []
    async add(buffer, event, isDrawCornersState = false, bbox, cornersState, currentSide) {
        const snapshot = await this.draw(buffer, event, isDrawCornersState, bbox, cornersState, currentSide)
        const imagePath = this.upload(snapshot.buffer)
        const photoRecord = {"image": imagePath, "date": djangoDate(new Date())}
        this.photos.push(photoRecord)
    }
    async draw(buffer, event, isDrawCornersState, bbox, cornersState, currentSide) {
        let snapshot = new Snapshot(buffer)
        let promises = [snapshot.drawEvent(event)]
        if (isDrawCornersState) promises.push(snapshot.drawCornersState(bbox, cornersState, currentSide))
        await Promise.all(promises)
        return snapshot
    }
    /**
     * @param {Buffer} buffer from Camera or Canvas
     * @returns {string} imagePath
     */
    upload(buffer) {
        const imagePath = `${process.env.folder || "images/undefined"}/${crypto.randomUUID()}.jpeg`
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
        .then(response => { logger("server response", response) })
        .catch(err => { logger("error report send", err.code) })
        logger("report sended",
        `corners: ${json.extra.cornersProcessed}\njson: ${body}\n\n`)

        this.photos = []

    }

}

module.exports = Report