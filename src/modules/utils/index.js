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



module.exports = { formatDate, bBox, djangoDate }