const fs = require('fs')
const crypto = require('crypto')

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
        const body = JSON.stringify(this.json)
        console.log("Report: ", this.json)
        fetch(this.endpoint, {
            method: "POST",
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body
        })
        .then(r => r.text())
        .then(response => { 
            console.log(response)
            fs.writeFile('debug/operation-control/log.txt', response, { flag: 'a+' }, err => { if (err) console.log("report not write to log", err)})
        })
        .catch(err => {
            console.log("error send", err.code)
        })
        const log = `${this.json.extra.startTracking}\ncorners: ${this.json.extra.cornersProcessed}\njson: ${body}\nimages:\n${this.imagesNames}\n\n`
        fs.writeFile('debug/operation-control/log.txt', log, { flag: 'a+' }, err => { if (err) console.log("report not write to log", err)})
    }
}

module.exports = Report