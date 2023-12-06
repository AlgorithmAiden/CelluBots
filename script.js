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
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ]

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
        richness: 100,
        frequency: .2,
        scale: 20
    },
    iron: {
        color: '#ddddff',
        richness: 100,
        frequency: .2,
        scale: 20
    },
    coal: {
        color: '#000000',
        richness: 100,
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
                    const richness = Math.round((1 - noise / frequency) * resource.richness)
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
    scale: 10
}

const defaultBotColor = '#000'
const backgroundColor = '#333'

const menuHeight = .2

import * as Menu from './Menu.js'
Menu.setCtx(ctx)
Menu.setMenu('home', {
    items: [
        { text: 'Quick Actions', func(self) { Menu.open('quick_actions') } },
        { text: 'Tick', func(self) { } },
        { text: 'Set Program', func(self) { } },
        { text: 'Run Program', func(self) { } },
        { text: 'Transfer Self', func(self) { } },
        { text: 'Start Auto Tick', func(self) { } },
        { text: 'Stop Auto Tick', func(self) { } },
        { text: 'TEST MENU', func(self) { Menu.open('test_menu') } },
    ]
})
Menu.setMenu('quick_actions', {
    items: [
        { text: 'Move Self', func(self) { } },
        { text: 'Move Item', func(self) { } },
        { text: 'Harvest', func(self) { } },
        { text: 'Craft', func(self) { } },
        { text: 'Change Mode', func(self) { } },
    ]
})
Menu.setMenu('test_menu', {
    onCreate(self) {
        self.items = []
        for (let i = 0; i < 25; i++)
            self.items.push({ text: `Item ${i}`, func() { } })
    }
})


function render() {
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

    //render each cell in range
    for (let x = minX; x <= maxX; x++)
        for (let y = minY; y <= maxY; y++) {
            const cell = grid.get(x, y)
            if (cell.resource) {
                ctx.fillStyle = resources[cell.resource].color
            }
            else if (cell.botId)
                ctx.fillStyle = defaultBotColor
            else
                ctx.fillStyle = backgroundColor
            ctx.fillRect(
                Math.floor(middleX + (x - viewPort.x) * cellSize - halfCellSize),
                Math.floor(middleY + (y - viewPort.y) * cellSize - halfCellSize),
                ceilCellSize,
                ceilCellSize
            )
        }

    //show where the viewpoint is
    ctx.fillStyle = '#0f06'
    ctx.fillRect(Math.floor(middleX - halfCellSize), Math.floor(middleY - halfCellSize), cellSize, cellSize)

}

setInterval(() => {
    if (currentKeys.includes('w'))
        viewPort.y -= viewPort.scale / 100
    if (currentKeys.includes('d'))
        viewPort.x += viewPort.scale / 100
    if (currentKeys.includes('s'))
        viewPort.y += viewPort.scale / 100
    if (currentKeys.includes('a'))
        viewPort.x -= viewPort.scale / 100
    if (currentKeys.includes('e'))
        viewPort.scale = Math.max(viewPort.scale * .99, 1)
    if (currentKeys.includes('q'))
        viewPort.scale *= 1.01

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // render()
    Menu.render(50, canvas.height * 1)
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
~ ~ resource: represented by { resource: 'copper', count: 10 }
~ ~ bot: represented by { botId: 17 }
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
items with a * cost an action (there is one action per turn) (the action will be used if the function runs successfully)
items with a ? can only be run in certain modes
~ * ? moveBot(dir): tries to move the direction, returns true if the move worked
~ moveItem(fromSlot, toSlot, count = stackSize): tries to move items from one slot to another, returns true if move worked
~ readSlot(slot): returns the items (if any) in the slot
~ look(dir): returns the cell next in the direction (type, resourceType, resourceCount, botId) (read only)
~ readInventory(dir): returns the inventory of the bot at dir, or false if there is no bot
~ * ? harvest(dir, slot): harvests one item from the dir and puts it in slot (if there is space in slot), returns true if an item was harvested (will always return false if there is no resource to harvest)
~ setSelfProgram(programName): sets its own program to programName, returns false if programName is invalid (current program will still finish)
~ ? setOtherProgram(programName, dir): sets the program of the bot at dir to programName, returns false if there is no bot or programName is invalid
~ getMem(dir): returns the mem of the bot at dir, or false if there is no bot
~ setMem(dir, mem): sets the mem of the bot at dir, returns true if there is a bot, otherwise false
~ * ? takeItem(dir, fromSlot, toSlot, count): takes items from the bot at dir to self, returns true on success
~ * ? giveItem(dir, fromSlot, toSlot, count): gives items from self to the bot at dir, returns true on success
~ * ? craft(recipeName, toSlot, count): crafts the recipe putting the results into toSlot, returns true if crafting succeeded
~ * changeMode(mode): starts changing bots mode, returns false if the mode is invalid
~ * ? placeBot(dir, fromSlot): places a new bot at dir, taking from slot, returns true if bot placed
~ * ? destroyBlock(dir, toSlot): removes any resource at the dir and putting 1 resource in toSlot, if there is a bot it will be picked up and placed in toSlot, returns true on success
~ * ? destroyItem(slot): destroys all items in said slot

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

Modes:
~ Harvester: can harvest resources
~ Mobile: can move
~ Crafter: can craft
~ Builder: can change other bots program + build bots
~ Destroyer: can destroy resources nodes + pick up bots + destroy items

Misc:
~ the bot gets one action per turn
~ the items in the bot have to in in a specific order to craft (eg to craft a gear they cave to be in a diamond shape (placeholder))

Bot File Structure:
~ {
    mem: {}, (can be seen by self + others)
    hasAction: true, (used for things like moving harvesting etc)
    x: 0,
    y: 0,
    inventory: [
        [5, 'copper_ore'],
        [0], (any slot with zero count is empty)
        [10, 'gear']
    ],
    mode: 'Harvester'
}

Bot Program Usage:
~ each bot has its own program, whose name is the same as the bots id
~ to set a bot program, a source program is input, and then copied for the bot (this is to prevent unwanted communications between bots)
~ each bot program is a plain .js program (located in ), where it can get game element with 'const Game = require('../GameIO.js')
~ the bots program will be run in its entirety each tick
~ GameIO.js will just require the stuff from here (script.js) and re export them, this is to create a smoother user experience without having to rename my program
~ the programs will be ran in './botPrograms/(botId)'

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

