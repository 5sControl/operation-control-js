const dispatcher = require('./Dispatcher')
const {djangoDate} = require('./utils/Date')

class MachineControl {

    check(buffer, { worker_detection }) {
        // this.buffer = buffer
        console.log(worker_detection)
    }

    async begin() {
        this.startTracking = djangoDate(new Date())
        this.isBeginTimer = 0
        this.isBeginTimerSuspense = 0
        this.window.currentSide = "first"
        dispatcher.emit("operation started", {buffer: this.buffer})
    }

    checkBatch(batch) {
        batch.forEach(snapshot => {
            this.check(snapshot.buffer, snapshot.detections)
            // snapshot.saveToDb()
        })
    }

}

const machine_control = new MachineControl()
dispatcher.on("batch detections ready", async ({batch}) => machine_control.checkBatch(batch))