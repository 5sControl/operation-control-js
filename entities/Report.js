const fs = require('fs')
const crypto = require('crypto')

class Report {
    constructor(serverUrl, hostname, controlType, potentialReports, controlPayload) {

        const isOperation = controlType === "operation_control" ? true : false
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
            "violation_found": isOperation ? potentialReports.length !== 4 : true,
            "extra": []
        }
        if (isOperation) {
            this.json.extra = controlPayload
        } else {
            if (controlPayload?.extra) this.json.extra = controlPayload.extra
        }

    }
    send() {
        const body = JSON.stringify(this.json)
        console.log("Report: ", this.endpoint, JSON.parse(body, null, 4))
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
    }
}

module.exports = Report