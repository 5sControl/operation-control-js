const fs = require('fs')
const crypto = require('crypto')

class Report {
    constructor(serverUrl, hostname, controlType, potentialReports, controlPayload) {

        this.endpoint = `${serverUrl}:80/api/reports/report-with-photos/`
        let photos = []
        for (const {buffer, createdAt} of potentialReports) {
            const fileName = crypto.randomUUID()
            const filePath = `images/${hostname}/${fileName}.jpeg`
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
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body
        })
        .catch(err => {
            console.log("error send", err.code)
        })
        fs.writeFile('operation_control_log.txt', body, { flag: 'a+' }, err => console.log(err))
    }
}

module.exports = Report