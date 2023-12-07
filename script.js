//this is the seed controlling all world generation
const firstSeed = Math.random() * 100

//gives a random number 0-1
const random = (() => {
    let seed = firstSeed
    const lcgRandom = () => {
        const a = 1664525
        const c = 1013904223
        const m = Math.pow(2, 32)
        seed = (a * seed + c) % m
        return seed / m
    }
    return lcgRandom
})()

//used for resource distribution
const perlinNoise = (() => {
    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10)
    }

    function lerp(t, a, b) {
        return a + t * (b - a)
    }

    function grad(hash, x, y, z) {
        var h = hash & 15                      // CONVERT LO 4 BITS OF HASH CODE
        var u = h < 8 ? x : y,                 // INTO 12 GRADIENT DIRECTIONS.
            v = h < 4 ? y : h == 12 || h == 14 ? x : z
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v)
    }

    function scale(n) {
        return (1 + n) / 2
    }

    return function (x, y, z) {
        var p = new Array(512)

        var permutation = [151, 160, 137, 91, 90, 15,
            131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
            251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
            49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180]
        for (var i = 0; i < 256; i++)
            p[256 + i] = p[i] = permutation[i]

        var X = Math.floor(x) & 255,                  // FIND UNIT CUBE THAT
            Y = Math.floor(y) & 255,                  // CONTAINS POINT.
            Z = Math.floor(z) & 255
        x -= Math.floor(x)                            // FIND RELATIVE X,Y,Z
        y -= Math.floor(y)                            // OF POINT IN CUBE.
        z -= Math.floor(z)
        var u = fade(x),                              // COMPUTE FADE CURVES
            v = fade(y),                              // FOR EACH OF X,Y,Z.
            w = fade(z)
        var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,        // HASH COORDINATES OF
            B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z     // THE 8 CUBE CORNERS,

        return scale(lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),  // AND ADD
            grad(p[BA], x - 1, y, z)),                    // BLENDED
            lerp(u, grad(p[AB], x, y - 1, z),             // RESULTS
                grad(p[BB], x - 1, y - 1, z))),           // FROM  8
            lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), // CORNERS
                grad(p[BA + 1], x - 1, y, z - 1)),        // OF CUBE
                lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
                    grad(p[BB + 1], x - 1, y - 1, z - 1)))))
    }

})()

//hold all the resource info
const resources = {
    copper: {
        color: '#ef7646',
        richness: 1000,
        frequency: .2,
        scale: 20
    },
    iron: {
        color: '#aaaaff',
        richness: 1000,
        frequency: .2,
        scale: 20
    },
    coal: {
        color: '#000000',
        richness: 1000,
        frequency: .2,
        scale: 20
    }
}

//give each resource a seed for generation
Object.keys(resources).forEach(key => {
    resources[key].seed = random() * 1_000
})

//setup the canvas
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

//make the canvas always fill the screen
function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
}
window.onresize = resize
resize()


//to read / wright, use grid.get / grid.set
const grid = {
    get(x, y) {
        x = Math.round(x)
        y = Math.round(y)
        const cords = `${x}/${y}`
        if (!grid[cords]) {
            let cell = {}
            const distance = Math.sqrt(-x * -x + -y * -y)
            Object.keys(resources).forEach(name => {
                const resource = resources[name]
                const noise = perlinNoise(x / resource.scale, y / resource.scale, resource.seed)
                const frequency = resource.frequency
                if (noise < frequency && distance > 10) {
                    const richness = Math.ceil((1 - noise / frequency) * resource.richness)
                    if ((!cell.resource) || ((!cell.resource) && cell.count < richness))
                        cell = { resource: name, count: richness }
                }
            })
            grid[cords] = cell
        }
        return grid[cords]
    },
    set(x, y, value) {
        x = Math.round(x)
        y = Math.round(y)
        grid[`${x}/${y}`] = value
    },
}

//x / y are for the center, scale is the number of cells to show on the smallest side
const viewPort = {
    x: 0,
    y: 0,
    scale: 100
}

//this is the bot the player controls / the viewfinder is tied to
let hauntedBotId = 50

const backgroundColor = '#333'

import * as Menu from './utils/Menu.js'
Menu.setCtx(ctx)
Menu.setMenu('home', {
    items: [
        { text: 'Quick Actions', func(self) { Menu.open('quick_actions') } },
        { text: 'Toggle Auto Tick', func(self) { autoTick = !autoTick } },
        { text: 'Tick', func(self) { oneTick = true } },
        { text: 'Set Program', func(self) { } },
        { text: 'Run Program', func(self) { } },
        { text: 'Settings', func(self) { Menu.open('settings') } },
        { text: 'Save Game', func(self) { } },
        { text: 'Load Game', func(self) { } },
    ]
})
Menu.setMenu('quick_actions', {
    items: [
        { text: 'Move Self', func(self) { } },
        { text: 'Move Item', func(self) { } },
        { text: 'Harvest', func(self) { } },
        { text: 'Craft', func(self) { } },
        { text: 'Change Mode', func(self) { } },
        { text: 'Transfer Self', func(self) { } },
    ]
})
Menu.setMenu('settings', {
    items: [
        { text: 'Increase Test Size', func(self) { } },
        { text: 'Decrease Text Size', func(self) { } },
    ]
})
Menu.setCorrectColor('#0f0')
Menu.setNormalColor('#060')
Menu.setHighlightedColor('#0f03')
Menu.setBackgroundColor('#000')
Menu.setFont('Droid Sans Mono')

const stackSize = 100

import * as Colors from './utils/Colors.js'
const botBackgroundColor = '#000'
const botModeColors = {}
const botModes = [
    'Blank',
    'Harvester',
    'Mobile',
    'Crafter',
    'Builder',
    'Destroyer',
    'Transferer',
]
botModes.forEach((mode, index) => {
    const color = Colors.createColor()
    color.saturation = 100
    color.lightness = 50
    color.hue = Math.round(100 / (botModes.length - 1) * index)
    botModeColors[mode] = color.hex
})
botModeColors['Blank'] = '#ffffff'

let nextBotId = 0
let bots = {}
function createBot(x, y, mode = 'Blank') {
    bots[nextBotId] = {
        mem: {},
        mode,
        source: '',
        inventory: new Array(9).fill(0).map(slot => ({ type: '', count: 0 })),
        x,
        y,
        id: nextBotId
    }
    grid.set(x, y, { botId: nextBotId })
    nextBotId++
}

for (let i = -50; i < 50; i++)
    createBot(0, i)

const runBots = (() => {
    let hasAction
    function moveBot(dir, bot) {
        const x = bot.x
        const y = bot.y
        if (hasAction && bot.mode == 'Mobile') {
            if (dir == 'up' && Object.keys(grid.get(x, y - 1)).length == 0) {
                bot.y--
                grid.set(x, y, {})
                grid.set(x, y - 1, { botId: bot.id })
                hasAction = false
                return true
            }
            if (dir == 'right' && Object.keys(grid.get(x + 1, y)).length == 0) {
                bot.x++
                grid.set(x, y, {})
                grid.set(x + 1, y, { botId: bot.id })
                hasAction = false
                return true
            }
            if (dir == 'down' && Object.keys(grid.get(x, y + 1)).length == 0) {
                bot.y++
                grid.set(x, y, {})
                grid.set(x, y + 1, { botId: bot.id })
                hasAction = false
                return true
            }
            if (dir == 'left' && Object.keys(grid.get(x - 1, y)).length == 0) {
                bot.x--
                grid.set(x, y, {})
                grid.set(x - 1, y, { botId: bot.id })
                hasAction = false
                return true
            }
        }
        return false
    }
    function changeMode(mode, bot) {
        if (hasAction && botModes.includes(mode)) {
            bot.inventory.forEach(slot => {
                if (slot.count > 0)
                    return false
            })
            bot.mode = mode
            hasAction = false
            return true
        }
        return false
    }
    function harvest(dir, slotIndex, bot) {
        const x = bot.x
        const y = bot.y
        if (hasAction && bot.mode == 'Harvester') {
            let targetX = x
            let targetY = y
            if (dir == 'up') targetY--
            else if (dir == 'right') targetX++
            else if (dir == 'down') targetY++
            else if (dir == 'left') targetX--
            const targetCell = grid.get(targetX, targetY)
            const slot = bot.inventory[slotIndex]
            if (targetCell.count > 0 && (slot.count == 0) || (slot.count < stackSize && slot.type == targetCell.resource)) {
                bot.inventory[slotIndex].count++
                bot.inventory[slotIndex].type = targetCell.resource
                if (targetCell.count > 1)
                    grid.set(targetX, targetY, { resource: targetCell.resource, count: targetCell.count - 1 })
                else
                    grid.set(targetX, targetY, {})
                return true
            } else return false
        }
        return false
    }
    return () => {
        Object.keys(bots).forEach(botId => {

            const bot = bots[botId]
            const x = bot.x
            const y = bot.y
            hasAction = true

            if (!['Mobile', 'Harvester'].includes(bot.mode)) {
                if (random() < .01)
                    changeMode('Harvester', bot)
            } else if (random() < .01)
                changeMode(['Builder', 'Crafter', 'Destroyer'][Math.floor(random() * 3)], bot)

            else if (bot.inventory[0].count == stackSize && bot.x > 0)
                if (bot.mode != 'Mobile')
                    changeMode('Mobile', bot)
                else
                    moveBot('left', bot)
            else if (bot.inventory[0].count > 0 && bot.x == 0)
                bot.inventory[0] = { type: '', count: 0 }

            else if (grid.get(x + 1, y).count > 0)
                if (bot.mode != 'Harvester')
                    changeMode('Harvester', bot)
                else
                    harvest('right', 0, bot)
            else
                if (bot.mode != 'Mobile')
                    changeMode('Mobile', bot)
                else
                    moveBot('right', bot)

        })
    }
})()

function renderGrid() {
    //clear the screen with a bright flashy color
    ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    //calculate some numbers for faster speed
    const middleX = canvas.width / 2
    const middleY = canvas.height / 2
    const smallSide = Math.min(canvas.width, canvas.height)
    const cellSize = smallSide / viewPort.scale
    const halfCellSize = cellSize / 2
    const ceilCellSize = Math.ceil(cellSize)
    const minX = Math.floor(viewPort.x - canvas.width / cellSize / 2)
    const minY = Math.floor(viewPort.y - canvas.height / cellSize / 2)
    const maxX = Math.ceil(viewPort.x + canvas.width / cellSize / 2)
    const maxY = Math.ceil(viewPort.y + canvas.height / cellSize / 2)

    //more calculations for the bot logos
    ctx.lineWidth = cellSize * .1
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    const offset = halfCellSize * .7
    const gapOffset = cellSize * .2
    const radius = halfCellSize * .35
    const twoPi = Math.PI * 2

    //glowing layer gets drawn last
    let glowSpots = []

    //render each cell in range
    for (let x = minX; x <= maxX; x++)
        for (let y = minY; y <= maxY; y++) {
            const cell = grid.get(x, y)
            if (cell.resource) {
                ctx.fillStyle = resources[cell.resource].color
            }
            else if (cell.botId != undefined)
                ctx.fillStyle = botBackgroundColor
            else
                ctx.fillStyle = backgroundColor
            ctx.fillRect(
                Math.floor(middleX + (x - viewPort.x) * cellSize - halfCellSize),
                Math.floor(middleY + (y - viewPort.y) * cellSize - halfCellSize),
                ceilCellSize,
                ceilCellSize
            )
            if (cell.botId != undefined) {
                ctx.strokeStyle = botModeColors[bots[cell.botId].mode]
                const centerX = middleX + (x - viewPort.x) * cellSize
                const centerY = middleY + (y - viewPort.y) * cellSize
                glowSpots.push({ x: centerX, y: centerY, color: ctx.strokeStyle })
                ctx.beginPath()
                ctx.moveTo(centerX - offset, centerY - offset)
                ctx.lineTo(centerX - offset + gapOffset, centerY - offset)
                ctx.moveTo(centerX + offset - gapOffset, centerY - offset)
                ctx.lineTo(centerX + offset, centerY - offset)
                ctx.lineTo(centerX + offset, centerY - offset + gapOffset)
                ctx.moveTo(centerX + offset, centerY + offset - gapOffset)
                ctx.lineTo(centerX + offset, centerY + offset)
                ctx.lineTo(centerX + offset - gapOffset, centerY + offset)
                ctx.moveTo(centerX - offset + gapOffset, centerY + offset)
                ctx.lineTo(centerX - offset, centerY + offset)
                ctx.lineTo(centerX - offset, centerY + offset - gapOffset)
                ctx.moveTo(centerX - offset, centerY - offset + gapOffset)
                ctx.lineTo(centerX - offset, centerY - offset)
                ctx.moveTo(centerX + radius, centerY)
                ctx.arc(centerX, centerY, radius, 0, twoPi)
                ctx.stroke()
            }
        }

    //render all the glow spots
    const glowSpotSize = cellSize * 5
    const halfGlowSpotSize = glowSpotSize / 2
    glowSpots.forEach(spot => {
        const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, halfGlowSpotSize)
        grad.addColorStop(0, `${spot.color.slice(0, 7)}66`)
        grad.addColorStop(1, `${spot.color.slice(0, 7)}00`)
        ctx.fillStyle = grad
        ctx.fillRect(spot.x - halfGlowSpotSize, spot.y - halfGlowSpotSize, glowSpotSize, glowSpotSize)
    })
}

let autoTick = false
let oneTick = false

setInterval(() => {
    if (Menu.getStack().length == 0) {
        if (currentKeys.includes('e'))
            viewPort.scale = Math.max(viewPort.scale * .99, -Infinity)
        if (currentKeys.includes('q'))
            viewPort.scale *= 1.01
    }

    if (autoTick || oneTick) {
        runBots()
        viewPort.x = bots[hauntedBotId].x
        viewPort.y = bots[hauntedBotId].y
        oneTick = false
        console.log('Tick')
    }

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    renderGrid()
    Menu.render(30, canvas.height * .2)

}, 0)

let currentKeys = []
document.addEventListener('keyup', event => {
    while (currentKeys.includes(event.key))
        currentKeys.splice(currentKeys.indexOf(event.key), 1)
})
document.addEventListener('keydown', event => currentKeys.push(event.key))

/*

Cell Structure:
~ there are three types of cells:
~ ~ blank, represented by {}
~ ~ resource: represented by { resource: string, count: number }
~ ~ bot: represented by { botId: number }
~ since there are only three types of cells, this can speed up a lot of things

Bot Structure:
~ every bot will have a unique id, which will never be used for another bot
~ every bot will have a unique program, which will never be used for another bot (this is to prevent unwanted communications between bots)
~ every bot will have a mode, changing modes takes quite some time (to encourage builds besides one bot does all)
~ every bot can see the 4 cells directly next to it
~ every bot has 9 inventory space
~ every bot will know its position in the grid / mode / id / inventory
~ every bot has its own memory accessible by other bots nearby / itself, but it can only hold Number / String / Boolean / Array / Object types (for communicating between bots)

Bot Commands:
~ * M moveBot(dir): tries to move the direction, returns true if the move worked
~ moveItem(fromSlot, toSlot, count = stackSize): tries to move items from one slot to another, returns true if move worked
~ readSlot(slot): returns the items (if any) in the slot
~ look(dir): returns the cell next in the direction (resource, count, botId) (read only)
~ readBot(dir): returns the bot info at dir (inventory, id, mode), returns false if there is no bot at dir
~ * H harvest(dir, slot): harvests one item from the dir and puts it in slot (if there is space in slot), returns true if an item was harvested (will always return false if there is no resource to harvest)
~ setSelfProgram(programName): sets its own program to programName, returns false if programName is invalid (current program will still finish)
~ B setOtherProgram(programName, dir): sets the program of the bot at dir to programName, returns false if there is no bot or programName is invalid
~ getMem(dir): returns the mem of the bot at dir, or false if there is no bot
~ setMem(dir, mem): sets the mem of the bot at dir, returns true if there is a bot, otherwise false
~ * T takeItem(dir, fromSlot, toSlot, count): takes items from the bot at dir to self, returns true on success
~ * T giveItem(dir, fromSlot, toSlot, count): gives items from self to the bot at dir, returns true on success
~ * C craft(recipeName, toSlot): crafts the recipe putting the results into toSlot, returns true if crafting succeeded
~ * changeMode(mode): changes bot mode, returns false if the mode is invalid
~ * B placeBot(dir, fromSlot): places a new bot at dir, taking from slot, returns true if bot placed
~ * D destroyBlock(dir, toSlot): removes any resource at the dir and putting 1 resource in toSlot, if there is a bot it will be picked up and placed in toSlot, returns true on success
~ * D destroyItem(slot): destroys all items in said slot
items with a * cost an actionPoint (there is one actionPoint per turn) (the action will be used if the function runs successfully)
items with a Mode can only be preformed by said mode
key: H: Harvester, M: Mobile, C: Crafter, B: Builder, D: Destroyer, T: Transferer

Modes:
~ Blank: does nothing
~ Harvester: can harvest resources
~ Mobile: can move
~ Crafter: can craft
~ Builder: can change other bots program + build bots
~ Destroyer: can destroy resource nodes + pick up bots + destroy items
~ Transferer: can transfer items from bot to bot

Tech:
~ the tech has to be input by the player
~ tech unlocks things like new recipes, new minable resources, new botCommands (such as global mem, etc), new modes
~ to win you must research and craft something hard
~ to unlock tech you sell items (partial sells can be done, and the tech will be closer to being unlocked)
~ example: {
    name: 'Place Bot',
    description: 'With this tech unlocked you can automate your helper, by placing new bots with new bots with new bots...',
    cost: [
        {name: 'gear', count: 100},
        {name: 'spring', count: 50}
    ],    
    unlocks: [
        {type: 'command', command: 'placeBot'}
    ]    
} (file structure is not finalized)    

Misc:
~ the bot gets one action per turn
~ the items in the bot have to in in a specific order to craft (eg to craft a gear they cave to be in a diamond shape (placeholder))

Bot File Structure:
~ {
    mem: {}, (can be seen by self + others)
    x: 0,
    y: 0,
    inventory: [
        [5, 'copper_ore'],
        [0], (any slot with zero count is empty)
        [10, 'gear']
    ],
    mode: 'Harvester',
    source: 'F217js=12sa=ca'
}

Bot Program Usage:
~ each bot will have a program hash as a string to use to find said program
~ when setting a program, the program will be copied and saved under its hash
~ each tick if no bot ran a program, it will be removed

Player Controls:
~ ideally the player should have no more info then any bot, but this idea taken to the extreme would simple be the player typing code and getting objects back, no visuals at all
~ so in actuality the player can see far, otherwise the game would not have the air of factory building others do
~ other than that, the player will be the same as the robots
~ using a command line interface to make some actions easier

Command Line Menus:
~ moveSelf: (tries to move)
~ ~ up
~ ~ right
~ ~ down
~ ~ left
~ moveItems:
~ ~ from:
~ ~ ~ to:
~ ~ ~ ~ count:
~ tick
~ setProgram
~ runProgram

Todo:
~ use some kind of noise to generate the resources
 */

const worker = new Worker('./botRunner.js')
worker.postMessage(JSON.stringify({
    1: 'console.log(\'Thing 1\')a'
}))
worker.onmessage = (e) => {
    console.log((e.data))
    worker.postMessage(e.data + 1)
}