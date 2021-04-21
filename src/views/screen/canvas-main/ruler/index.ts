import { addClass, removeClass } from '@/utils/dom'

type LayoutDirection = 'LR' | 'TB'

interface RulerOption {
  direction: LayoutDirection
  rulerWidth: number
  rulerHeight: number
  bgColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  strokeStyle: string
  lineWidth: number
  enableMouseTracking: boolean
  enableToolTip: boolean
  scale: number
  offset: number
  ratio: number
}

const pixelize = (val: number | string) => {
  return val + 'px'
}

class GuideLine {
  dragContainer: HTMLDivElement

  constructor(
    private el: HTMLElement,
    public guideLine: HTMLDivElement,
    private options: RulerOption,
    private event: MouseEvent,
  ) {
    this.dragContainer = el.querySelector('.ruler-wrapper') as HTMLDivElement

    guideLine.addEventListener('mousedown', this.mousedown)
    guideLine.addEventListener('mouseup', this.stopMoving)
    guideLine.addEventListener('dblclick', this.dblclick)

    this.startMoving(event)
  }

  startMoving(e: MouseEvent) {
    const { el, guideLine, dragContainer, options } = this
    addClass(guideLine, 'rul_line_dragged')

    const divTop = parseInt(guideLine.style.top) || 0,
      divLeft = parseInt(guideLine.style.left) || 0,
      eWi = guideLine.offsetWidth,
      eHe = guideLine.offsetHeight,
      cWi = dragContainer.offsetWidth,
      cHe = dragContainer.offsetHeight,
      cursor = options.direction == 'TB' ? 'ns-resize' : 'ew-resize'

    el.style.cursor = cursor
    guideLine.style.cursor = cursor
    const diffX = e.clientX - divLeft,
      diffY = e.clientY - divTop
    document.onmousemove = evt => {
      const aX = Math.min(Math.max(evt.clientX - diffX, 0), cWi - eWi)
      const aY = Math.min(Math.max(evt.clientY - diffY, 0), cHe - eHe)
      guideLine.style.left = pixelize(aX)
      guideLine.style.top = pixelize(aY)
      this.updateToolTip(aX, aY)
    }
    this.showToolTip()
  }

  stopMoving() {
    this.el.style.cursor = ''
    this.guideLine.style.cursor = ''
    document.onmousemove = null
    this.hideToolTip()
    removeClass(this.guideLine, 'rul_line_dragged')
  }

  showToolTip() {
    if (!this.options.enableToolTip) {
      return
    }
    addClass(this.guideLine, 'rul_tooltip')
  }

  updateToolTip(x: number, y: number) {
    const { guideLine, options } = this
    const { rulerHeight, offset, scale } = options
    if (y) {
      guideLine.dataset.tip = 'Y: ' + Math.round((y - rulerHeight - 1 - offset) * scale) + ' px'
    } else {
      guideLine.dataset.tip = 'X: ' + Math.round((x - rulerHeight - 1 - offset) * scale) + ' px'
    }
  }

  hideToolTip() {
    removeClass(this.guideLine, 'rul_tooltip')
  }

  show() {
    this.guideLine.style.display = 'block'
  }

  hide() {
    this.guideLine.style.display = 'none'
  }

  mousedown(e: MouseEvent) {
    e.stopPropagation()
    this.startMoving(e)
  }

  dblclick(e: any) {
    e.stopPropagation()
    this.destroy()
  }

  destroy() {
    const { guideLine } = this
    this.stopMoving()
    guideLine.removeEventListener('mousedown', this.mousedown)
    guideLine.removeEventListener('mouseup', this.stopMoving)
    guideLine.removeEventListener('dblclick', this.dblclick)
    guideLine.parentNode && guideLine.parentNode.removeChild(guideLine)
  }
}

// 创建高分辨率画布
const createCanvas = (el: HTMLCanvasElement | null, width: number, height: number, ratio: number) => {
  const canvas = el ?? document.createElement('canvas')
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = pixelize(width)
  canvas.style.height = pixelize(height)

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  return canvas
}

export class RulerBuilder {
  el: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  indicator: HTMLDivElement
  indicatorValue: HTMLSpanElement
  indicatorLineWidth = 1

  ruler = {
    orgPos: 0,
    thickness: 0,
    width: 0,
    height: 0,
  }

  guides: GuideLine[] = []

  options: RulerOption = {
    direction: 'TB',
    rulerWidth: 1000,
    rulerHeight: 20,
    bgColor: '#0e1013',
    fontFamily: 'sans-serif',
    fontSize: '10px',
    fontColor: '#90a0ae',
    strokeStyle: 'rgba(161, 174, 179, 0.8)',
    lineWidth: 0.5,
    enableMouseTracking: true,
    enableToolTip: true,
    scale: 1,
    offset: 40,
    ratio: 2,
  }

  constructor(container: HTMLElement, options: Partial<RulerOption>) {
    this.el = container
    this.options = { ...this.options, ...options }

    this.constructRuler()
  }

  // 创建标尺
  constructRuler() {
    const { el, options } = this
    const { direction, rulerWidth, rulerHeight, ratio } = options

    const width = direction === 'TB'
      ? Math.max(el.offsetWidth, rulerWidth)
      : Math.max(el.offsetHeight, rulerWidth)
    const height = rulerHeight

    this.ruler.width = width
    this.ruler.height = height

    // 创建高分辨率画布
    const canvas = createCanvas(null, width, height, ratio)
    addClass(canvas, 'canvas-ruler')
    el.appendChild(canvas)

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!

    this.drawRuler()

    canvas.addEventListener('mouseenter', this.constructIndicator.bind(this))
    canvas.addEventListener('mousedown', this.constructGuide.bind(this))
  }

  // 画标尺
  drawRuler() {
    const { ctx, options, ruler } = this
    const { width, height } = ruler

    ctx.beginPath()
    ctx.fillStyle = options.bgColor
    ctx.fillRect(0, 0, width, height)
    ctx.closePath()

    ctx.beginPath()
    ctx.font = `${options.fontSize} ${options.fontFamily}`
    ctx.textAlign = 'left'
    ctx.fillStyle = options.fontColor
    ctx.strokeStyle = options.strokeStyle
    ctx.lineWidth = options.lineWidth
    this.drawPoints()
    ctx.stroke()
  }

  // 画刻度
  drawPoints() {
    const { ctx, options, ruler } = this
    const { width, height } = ruler
    const { offset, scale } = options

    const maxTickLen = 0,
      medTickLen = height / 1.5,
      minTickLen = height / 1.2

    for (let pos = 0; pos <= width; pos += 1) {
      const delta = pos - offset
      if (delta < 0) continue

      let label = -1
      let tickLen = -1
      if (delta % 50 === 0) {
        label = Math.floor(delta / scale)
        tickLen = maxTickLen
      } else if (delta % 25 === 0) {
        tickLen = medTickLen
      } else if (delta % 5 === 0) {
        tickLen = minTickLen
      }

      if (tickLen >= 0) {
        ctx.moveTo(pos + 0.5, height + 0.5)
        ctx.lineTo(pos + 0.5, tickLen)
        if (label > -1) {
          ctx.fillText(`${label}`, pos + 2.5, height / 1.5)
        }
      }
    }
  }

  private getPos(e: MouseEvent) {
    const { el, options, indicatorLineWidth } = this
    const { direction, offset, scale, rulerHeight } = options
    let distance = 0
    if (direction == 'TB') {
      distance = e.clientX - (el.parentElement?.offsetLeft || 0)
    } else {
      distance = e.clientY - (el.parentElement?.offsetTop || 0)
    }

    distance = distance - rulerHeight + indicatorLineWidth
    const coor = Math.floor((distance - offset) / scale)
    return {
      coor,
      distance,
    }
  }

  private getDistanceByCoor(coor: number) {
    const { scale, offset } = this.options
    return parseFloat((coor * scale + offset).toFixed(3))
  }

  // 画指示线
  constructIndicator() {
    const { el, canvas } = this
    const indicator = document.createElement('div')
    const indicatorValue = document.createElement('span')
    addClass(indicator, 'ruler-indicator')
    addClass(indicatorValue, 'indicator-value')
    indicator.appendChild(indicatorValue)

    this.indicator = indicator
    this.indicatorValue = indicatorValue
    el.appendChild(indicator)

    const move = (e: MouseEvent) => {
      const pos = this.getPos(e)
      indicator.style.left = pixelize(pos.distance)
      indicatorValue.textContent = `${pos.coor}`
    }

    const out = () => {
      indicator.remove()
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseout', out)
    }

    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseout', out)
  }

  // 创建参考线
  constructGuide(e: MouseEvent) {
    const { el, options } = this

    const guide = document.createElement('div')
    guide.title = '双击删除参考线'
    addClass(guide, 'ruler-line')

    const pos = this.getPos(e)
    if (options.direction === 'TB') {
      guide.style.left = pixelize(pos.distance)
    } else {
      guide.style.top = pixelize(pos.distance)
    }

    guide.innerHTML = `<div class="line-action"><span class="line-value">${pos.coor}</span></div>`

    let guideWp = el.querySelector('.lines-wrapper')
    if (!guideWp) {
      guideWp = document.createElement('div')
      addClass(guideWp as HTMLDivElement, 'lines-wrapper')
      el.appendChild(guideWp)
    }

    guideWp.appendChild(guide)

    // const guideLine = new GuideLine(el, guide, options, e)
    // this.guides.push(guideLine)
  }

  setSize(w: number, h: number, s: number) {
    const { el, options } = this
    options.rulerWidth = w
    options.rulerHeight = h
    options.scale = s
    const { direction, rulerWidth, rulerHeight, ratio } = options

    const width = direction === 'TB'
      ? Math.max(el.offsetWidth, rulerWidth)
      : Math.max(el.offsetHeight, rulerWidth)
    const height = rulerHeight

    this.ruler.width = width
    this.ruler.height = height

    createCanvas(this.canvas, width, height, ratio)
    this.drawRuler()
  }

  setScale(scale: number) {
    this.options.scale = scale
    this.drawRuler()
  }

  toggleGuide(visible: boolean) {
    const func = visible ? 'show' : 'hide'
    this.guides.forEach(guide => guide[func]())
  }

  clearGuides() {
    this.guides.forEach(guide => guide.destroy())
    this.guides = []
  }

  destroy() {
    const { el, canvas } = this
    this.clearGuides()

    canvas.removeEventListener('mouseenter', this.constructIndicator.bind(this))
    canvas.removeEventListener('mousedown', this.constructGuide.bind(this))
    el.remove()
  }
}
