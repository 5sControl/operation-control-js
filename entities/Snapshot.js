const fs = require('fs')
const {djangoDate} = require('../utils')
const {createCanvas, Image} = require('@napi-rs/canvas')

class Snapshot {
    constructor(buffer) {
        this.createdAt = djangoDate(new Date())
        this.buffer = buffer
    }

    createCtx() {
        this.canvas = createCanvas(1920, 1080)
        this.ctx = this.canvas.getContext('2d')
        const image = new Image()
        image.src = this.buffer
        this.ctx.drawImage(image, 0, 0)
    }

    async drawBbox(prediction) {
        if (!this.ctx) this.createCtx()

        const classesColors = {
            "hkk": "red", "marker": "blue", "nippers": "orange", "sealant": "purple", "rag": "green",
            "window": "teal", "worker": "blue"
        }

        const {bbox, class: className, score} = prediction

        const rectOffset = 20
        this.ctx.lineWidth = rectOffset
        this.ctx.strokeStyle = classesColors[className] || "blue"
        const [x, y, width, height] = bbox
        this.ctx.strokeRect(x - rectOffset, y - rectOffset, width + rectOffset * 2, height + rectOffset * 2)

        this.ctx.font = "bold 24px Arial"
        this.ctx.fillStyle = "yellow"
        this.ctx.fillText(`${className}, ${Math.floor(score * 100)}`, x - rectOffset - 10, y - rectOffset + 5)

        this.buffer = await this.canvas.encode('jpeg', 50)
    }


    async drawAreas(areas) {
        if (!this.ctx) this.createCtx()
        this.ctx.lineWidth = 3

        areas.forEach((area) => {
            const {coord} = area;
            const {x1, x2, y1, y2} = coord

            this.ctx.strokeStyle = '#FE6100';
            this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            this.ctx.font = "bold 20px Inter"
            this.ctx.fillStyle = "white"
            const text = area.itemName ? `${area.itemName}: ${area.prediction.length}` : `${area.itemId}: ${area.prediction.length}`
            this.ctx.fillText(text, x1 + 10, y1 + 15)
        })

        // this.buffer = await this.canvas.encode('jpeg', 100)
    }

    async drawDescription(description) {
        this.ctx.font = "bold 48px Inter"
        this.ctx.fillStyle = "white"
        this.ctx.fillText(description, 100, 1040)
    }

    async drawBoxes(areas) {
        this.ctx.lineWidth = 3
        this.ctx.strokeStyle = "#BF09FF"
        let count = 0;
        areas.forEach((area, id) => {
            area.prediction.forEach((prediction, id) => {
                count++
                const {x, y, width, height} = prediction;
                this.ctx.strokeRect(x + area.coord.x1, y + area.coord.y1, width, height)


                this.ctx.font = "bold 16px Inter"

                if (count === 1 || count % 5 === 0) {
                    this.ctx.fillStyle = "#FFE609"
                    this.ctx.fillText(count.toString(), x + area.coord.x1 + 4, y + area.coord.y1 + 16)
                }

                if (area.prediction.length === (id + 1)) {
                    this.ctx.fillStyle = "#3AFF09"
                    this.ctx.fillText(count.toString(), x + area.coord.x1 + 4, y + area.coord.y1 + 16)
                }


            })
        })
        this.buffer = await this.canvas.encode('jpeg', 100)
    }


    async join(canvasArea, name, ctxArea, coord, ctxFullImage) {
        const img = ctxArea.getImageData(0, 0, coord.x2 - coord.x1, coord.y2 - coord.y1);
        ctxFullImage.putImageData(img, coord.x1, coord.y1);
    }


    async drawPoint(point) {
        if (!this.ctx) this.createCtx()

        const [x, y] = point
        this.ctx.beginPath()
        this.ctx.arc(x, y, 10, 0, 2 * Math.PI)
        this.ctx.fillStyle = "yellow"
        this.ctx.fill()
        this.ctx.lineWidth = 5
        this.ctx.strokeStyle = "red"
        this.ctx.stroke()

        this.buffer = await this.canvas.encode('jpeg', 100)
    }

    async drawThreshold(isHorizontal, coord) {
        if (!this.ctx) this.createCtx()
        this.ctx.beginPath()
        if (isHorizontal) {
            this.ctx.moveTo(0, coord)
            this.ctx.lineTo(1920, coord)
        } else {
            this.ctx.moveTo(coord, 0)
            this.ctx.lineTo(coord, 1080)
        }
        this.ctx.lineWidth = 15
        this.ctx.strokeStyle = "red"
        this.ctx.setLineDash([15, 15])
        this.ctx.stroke()
        this.ctx.setLineDash([])
        this.buffer = await this.canvas.encode('jpeg', 50)
    }

    async drawEvent(text) {
        if (!this.ctx) this.createCtx()

        this.ctx.font = "bold 48px Arial"
        this.ctx.fillStyle = "red"
        this.ctx.fillText(`${text}`, 200, 1000)

        this.buffer = await this.canvas.encode('jpeg', 50)
    }

    async drawLog(info) {
        if (!this.ctx) this.createCtx()

        this.ctx.font = "bold 24px Arial"
        this.ctx.fillStyle = "white"
        this.ctx.fillText(`${info}`, 200, 1040)

        this.buffer = await this.canvas.encode('jpeg', 50)
    }

    saveTo(path) {
        fs.writeFileSync(path, this.buffer)
    }
}

module.exports = Snapshot