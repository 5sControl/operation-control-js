// 2D
// https://rust-sdl2.github.io/rust-sdl2/sdl2/rect/struct.Rect.html

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

module.exports = { bBox }