function colorPlusAlpha(color, alpha) {
    if (alpha.length == 1) alpha = alpha + alpha
    if (color.length < 7) return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + alpha
    if (color.length == 7) return color + alpha
    return color.slice(0, 7) + alpha
}
const Console = {
    backgroundColor: '#000',
    items: [],
    maxHeight: 100,
    ctx: undefined,
    lastAddedTime: 0,
    fadeTime: 5000,
    defaultFont: 'ariel',
    defaultTextSize: 50,
    defaultColor: '#0f0',
    render() {
        const ctx = Console.ctx
        const items = Console.items
        const maxHeight = Console.maxHeight
        const maxWidth = canvas.width
        const elapsedTime = Date.now() - Console.lastAddedTime
        const ratio = Math.min(elapsedTime / Console.fadeTime, 1)
        const alpha = Math.floor(255 - 255 * ratio).toString(16).padStart(2, '0')
        ctx.textBaseline = 'bottom'
        ctx.fillStyle = colorPlusAlpha(Console.backgroundColor, alpha)
        ctx.fillRect(0, canvas.height - maxHeight, canvas.width, maxHeight)
        let y = 0
        items.forEach(item => {
            ctx.font = `${item.size ?? Console.defaultTextSize}px ${item.font ?? Console.defaultFont}`
            if (true || y < maxHeight) {
                let grad = ctx.createLinearGradient(0, canvas.height - maxHeight, 0, canvas.height)
                grad.addColorStop(0, '#0000')
                grad.addColorStop(.01, colorPlusAlpha(item.color ?? Console.defaultColor, alpha))
                ctx.fillStyle = grad
                ctx.fillText(item.text, 0, canvas.height - y, maxWidth)
            }
            y += item.size ?? Console.defaultTextSize
        })
    },
    log(item) {
        if (typeof item == Object)
            Console.items.unshift(item)
        else
            Console.items.unshift({ text: item })
        Console.lastAddedTime = Date.now()
    },
    clear() {
        Console.items = []
        Console.lastAddedTime = 0
    }
}
export default Console