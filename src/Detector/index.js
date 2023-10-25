const {bboxAtWorkspace} = require('../utils/2D')
const {createCanvas, Image} = require('canvas')
const loadYoloV8 = require('./models/yolov8')

class Detector {

    model
    
    async init() {
        if (!this.model) {
            console.time(`detector models load`)
            this.model = {
                w: await loadYoloV8(`./corner-cleaning/ww/model.json`),
                o: await loadYoloV8(`./corner-cleaning/wo/model.json`, true)
            }
            console.timeEnd(`detector models load`)
        }
    }
    async detect(buffer) {
        const ww_detections = await this.model.w.detect(buffer) // YoloDetection[]
        const window_detection = ww_detections.find(d => d.class === 'window' && d.score > 0.5 && bboxAtWorkspace(d.bbox, WORKSPACE_ZONE))
        const worker_detection = ww_detections.find(d => d.class === 'worker' && d.score > 0.5 && bboxAtWorkspace(d.bbox, WORKSPACE_ZONE))
        const detect_window_and_worker = worker_detection && window_detection ? true : false
        const detect_nothing = !worker_detection && !window_detection
        let action_detection
        if (worker_detection) {
            const workerBlob = await this.cutRegionFromBlob(buffer, worker_detection.bbox)
            let wo_detections = await this.model.o.detect(workerBlob)
            if (wo_detections[0]?.score > 0.9) {
                wo_detections = wo_detections.map(d => {
                    d.x = d.x + worker_detection.x
                    d.y = d.y + worker_detection.y
                    d.bbox[0] = d.x
                    d.bbox[1] = d.y
                    return d
                })
                if (bboxAtWorkspace(wo_detections[0]?.bbox, WORKSPACE_ZONE)) action_detection = wo_detections[0]
            }
        }
        return {
            window_detection,
            worker_detection,
            detect_window_and_worker,
            detect_nothing,
            action_detection // undefined || YoloDetection
        }
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
        const croppedBlob = newCan.toBuffer('image/jpeg', { quality: 0.9 })
        return croppedBlob
    }
    async detectBatch(batch) {
        const prev = Date.now()
        let workers = []
        batch.forEach(snapshot => workers.push(this.detect(snapshot.buffer)))
        const detectionsArray = await Promise.all(workers)
        const now = Date.now()
        console.log(`batch detection - ${now - prev}ms`)
        detectionsArray.forEach((detections, i) => batch[i].detections = detections)
        dispatcher.emit("batch detections ready", { batch, notForConsole: true })
    }
    
}

const detector = new Detector()
dispatcher.on("container started", async () => await detector.init())
dispatcher.on("new snapshot received", async ({snapshot}) => {
    try {        
        if (!detector.model) return
        const detections = await detector.detect(snapshot.buffer)
        snapshot.detections = detections
        dispatcher.emit("snapshot detections ready", { snapshot, notForConsole: true })
    } catch (error) {
        console.log(error)
    }
})