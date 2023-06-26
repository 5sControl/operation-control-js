const workerpool = require('workerpool')
const loadYoloV8 = require('../models/yolov8')

loadYoloV8(`./corner-cleaning/ww/model.json`)
.then(model => workerpool.worker({detect: model.detect}))