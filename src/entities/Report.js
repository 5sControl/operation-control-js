const fs = require('fs')
const crypto = require('crypto')
const {logger} = require("./Logger")

class Report {
    constructor(serverUrl, hostname, controlType, potentialReports, controlPayload) {

        this.endpoint = `${serverUrl}:80/api/reports/report-with-photos/`
        let photos = []
        this.imagesNames = []
        for (const {buffer, createdAt} of potentialReports) {
            const fileName = crypto.randomUUID()
            const imageName = `${fileName}.jpeg`
            this.imagesNames.push(imageName)
            const filePath = `images/${hostname}/${imageName}`
            fs.writeFile(filePath, buffer, err => {
                if(err) console.log(err)
            })
            const fileObject = {"image": filePath, "date": createdAt}
            photos.push(fileObject)
        }

        this.json = {
            "algorithm": controlType,
            "camera": hostname,
            "start_tracking": photos[0].date,
            "stop_tracking": photos[photos.length - 1].date,
            "photos": photos,
            "violation_found": controlPayload.cornersProcessed !== 4,
            "extra": controlPayload
        }

    }
    send() {
        const body = JSON.stringify(this.json, null, 2)
        fetch(this.endpoint, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { logger("server response", response) })
        .catch(err => { logger("error report send", err.code) })
        logger("report sended",
        `corners: ${this.json.extra.cornersProcessed}\njson: ${body}\nimages:\n${this.imagesNames}\n\n`)
    }
}

module.exports = Report