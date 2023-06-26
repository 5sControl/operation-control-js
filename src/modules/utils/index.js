const {accessSync, mkdirSync} = require('fs')
const {createCanvas, Image} = require('@napi-rs/canvas')

// Path
function isExists(dir) {
    try {
        accessSync(dir)
        console.log('Dir exists')
    } catch (err) {
        if (err.code === 'ENOENT') {
            mkdirSync(dir)
            console.log(dir, "created successfully... ")
        }
    }
}
/**
 * @param {string[]} dirs
 * @returns {true | ReferenceError} created folders or not
 */
function checkDirs(dirs) {
    try {
        for (const dir of dirs) {
            isExists(dir)
        }
        return true
    } catch (error) {
        return error
    }
}


// Date
function padTo2Digits(num) {
    return num.toString().padStart(2, '0')
}
function formatDate(date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        '-' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join('-')
    )
}
function djangoDate(date) {
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-')
        + ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds())
        ].join(':')
        + '.' +
        date.getMilliseconds()

    )
}

// 2D
const bBox = {
    convert(prediction) {
        const {x, y, width, height} = prediction
        return [x, y, width, height]
    },
    getOrigin(bbox) {
        if (Array.isArray(bbox)) {
            const [x, y, width, height] = bbox
            let originX = x + width / 2
            let originY = y + height / 2
            return [originX, originY]
        }
    }
}
function pointsDistanceModule(point_1, point_2) {
    let xModule = Math.floor(Math.abs(point_1[0] - point_2[0]))
    let yModule = Math.floor(Math.abs(point_1[1] - point_2[1]))
    return [xModule, yModule]
}


/**
 * @returns {Blob}
 */
async function cutRegionFromBlob(blob, sourceResolution, region) {
    
    const [cHeight, cWidth] = sourceResolution
    let canvas = createCanvas(cWidth, cHeight)
    let ctx = canvas.getContext('2d')
    const image = new Image()
    image.src = blob
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

module.exports = {isExists, checkDirs, formatDate, bBox, djangoDate, cutRegionFromBlob}