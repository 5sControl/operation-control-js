const ModelWorker = require('./workers/ModelWorker')
const {withinWorkspace} = require('../utils/2D')
const {createCanvas, Image} = require('@napi-rs/canvas')

class Detector {

    model
    detections
    WORKSPACE_RECT = [0, 0, 1600, 900]
    
    constructor() {
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
        const ww_detections = await this.model.w.exec(buffer) // YoloDetection[]
        const window_detection = ww_detections.find(d => d.class === 'window' && d.score > 0.5 && withinWorkspace(d.bbox, [1600, 900]))
        const worker_detection = ww_detections.find(d => d.class === 'worker' && d.score > 0.5)
        const detect_window_and_worker = worker_detection && window_detection ? true : false
        const detect_nothing = !worker_detection && !window_detection
        let action_detection
        if (worker_detection) {
            const workerBlob = await this.cutRegionFromBlob(buffer, worker_detection.bbox)
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
        this.detections = {
            window_detection,
            worker_detection,
            detect_window_and_worker,
            detect_nothing,
            action_detection // undefined || YoloDetection
        }
        return this.detections
    }
    /**
     * @returns {Blob}
     */
    async cutRegionFromBlob(buffer, region) {
    
        const [cHeight, cWidth] = [1080, 1920]
        let canvas = createCanvas(cWidth, cHeight)
        let ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = buffer
        ctx.drawImage(image, 0, 0)

        const [x, y, width, height] = region
        const OFFSET = 20
        let cuttedWorker = ctx.getImageData(x - OFFSET, y - OFFSET, width + OFFSET, height + OFFSET)

        let newCan = createCanvas(width + OFFSET, height + OFFSET)
        let newCtx = newCan.getContext('2d')
        newCtx.putImageData(cuttedWorker, 0, 0)
        const croppedBlob = await newCan.encode('jpeg', 90)
        return croppedBlob
    }
    async detectBatch(batch) {
        const prev = Date.now()
        let workers = []
        batch.forEach(buffer => workers.push(this.detect(buffer)))
        const result = await Promise.all(workers)
        const now = Date.now()
        console.log(`detection - ${now - prev}ms`)
        return result
    }
    
}

const detector = new Detector()

module.exports = detector