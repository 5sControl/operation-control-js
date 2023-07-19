const machine_control = {
    TIME_LIMIT: 15, // seconds
    previous_snapshot: null,
    is_previous_snapshot_with_worker_detection: true, // tumbler
    snapshots_without_worker_detection: [], // accumulator
    first_snapshot_for_report: null,
    check(checked_snapshot) {
        if (!checked_snapshot.detections.worker_detection) {
            console.log("machine: accumulate")
            if (this.snapshots_without_worker_detection.length === 0) {
                this.first_snapshot_for_report = this.previous_snapshot
                console.log("machine: start accumulate", this.first_snapshot_for_report)
            }
            this.is_previous_snapshot_with_worker_detection = false
            this.snapshots_without_worker_detection.push(checked_snapshot)
        } else {
            if (!this.is_previous_snapshot_with_worker_detection) {
                console.log("machine: finish accumulator")
                this.is_previous_snapshot_with_worker_detection = true
                console.log("machine: accumulator length", this.snapshots_without_worker_detection.length)
                if (this.snapshots_without_worker_detection.length > this.TIME_LIMIT) {
                    console.log("machine: accumulator with violation (exceed TIME_LIMIT)")
                    const second_snapshot_for_report = this.snapshots_without_worker_detection.at(0)
                    const third_snapshot_for_report = this.snapshots_without_worker_detection.at(-1)
                    const snapshots_for_report = [
                        this.first_snapshot_for_report,
                        second_snapshot_for_report,
                        third_snapshot_for_report,
                        checked_snapshot
                    ]
                    dispatcher.emit("machine: report", {snapshots_for_report})
                    this.first_snapshot_for_report = null
                }
                this.snapshots_without_worker_detection = []
                console.log("machine: clean accumulator")
            }
        }
        if (!this.first_snapshot_for_report) this.previous_snapshot = checked_snapshot
        dispatcher.emit("snapshot checked", {snapshot: checked_snapshot})
    },
    checkBatch(batch) {
        batch.forEach(snapshot => this.check(snapshot))
    }
}
dispatcher.on("batch detections ready", async ({batch}) => machine_control.checkBatch(batch))