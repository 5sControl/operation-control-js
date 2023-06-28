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

function isOperationOnWindow(operationBbox, windowBbox) {
    const operationRect = convertBboxToRect(operationBbox)
    const windowRect = convertBboxToRect(windowBbox)
    return rectanglesIntersect(operationRect, windowRect)
}
function convertBboxToRect(bbox) {
    const [x, y, width, height] = bbox
    return [x, y, x + width, y + height]
}
/**
 * @returns {boolean}
 */
function rectanglesIntersect(rectA, rectB) {
    const [minAx, minAy, maxAx, maxAy] = rectA
    const [minBx,  minBy,  maxBx,  maxBy] = rectB
    return maxAx >= minBx && minAx <= maxBx && minAy <= maxBy && maxAy >= minBy
}

function withinWorkspace(bbox, rect) { // rect in another rect
    const [x, y, width, height] = bbox
    return x < rect[0] && y < rect[1] ? true : false
}

/**
 * @returns {"left" | "right"}
 */
function whatSide(rect, window_bbox) {
    if (rect !== null) {
        const operationOrigin = bBox.getOrigin(rect)
        const [x, y, width, height] = window_bbox
        const corners = [[x, y+height], [x+width, y+height]]
        if (operationOrigin) {
            const diffX = operationOrigin[0] - corners[0][0]
            const halfWindowWidth = (corners[1][0] - corners[0][0])/2
            const side = diffX < halfWindowWidth ? "left" : "right"
            return side
        }
    } else {
        return "right"
    }
}

module.exports = { bBox, isOperationOnWindow, withinWorkspace, whatSide }