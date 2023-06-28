const ModelWorker = require('./workers/ModelWorker')
const Snapshot = require('../Snapshot')
const {withinWorkspace} = require('../utils/2D')

class Detector {

    model
    predictions
    WORKSPACE_RECT = [0, 0, 1600, 900]

    async loadModels() {
        if (!this.model) {
            console.time(`detector models load`)
            this.model = {
                w: new ModelWorker("ww"),
                o: new ModelWorker("wo")
            }
            console.timeEnd(`detector models load`)
        }
    }
    async detect(buffer) {
        console.time("detection")
        const ww_detections = await this.model.w.exec(buffer) // YoloDetection[]
        const window_detection = ww_detections.find(d => d.class === 'window' && d.score > 0.5 && withinWorkspace(d.bbox, [1600, 900]))
        const worker_detection = ww_detections.find(d => d.class === 'worker' && d.score > 0.5)
        const detect_window_and_worker = worker_detection && window_detection ? true : false
        const detect_nothing = !worker_detection && !window_detection
        let action_detection
        if (worker_detection) {
            const snapshot = new Snapshot(buffer)
            const workerBlob = await snapshot.cutRegionFromBlob(worker_detection.bbox)
            let wo_detections = await this.model.o.exec(workerBlob)
            if (wo_detections[0]?.score > 0.9 && withinWorkspace(wo_detections[0]?.bbox, [1600, 900])) {
                wo_detections = wo_detections.map(d => {
                    d.x = d.x + worker_detection.x
                    d.y = d.y + worker_detection.y
                    d.bbox[0] = d.x
                    d.bbox[1] = d.y
                    return d
                })
                action_detection = wo_detections[0]
            }
        }
        console.timeEnd("detection")
        return {
            window_detection,
            detect_window_and_worker,
            detect_nothing,
            action_detection // undefinde || YoloDetection
        }
    }
    
}

module.exports = Detector