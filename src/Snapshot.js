class Snapshot {
    constructor(buffer, index) {
        this.buffer = buffer
        this.launch = process.env.launch
        this.index = index.toString()
        this.received = new Date()
        this.detections = []
    }
}

module.exports = Snapshot