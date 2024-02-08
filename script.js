import * as Colors from './utils/Colors.js'
import * as Menu from './utils/Menu.js'
import Console from './utils/Console.js'
import recipes from './recipes.js'
import SPTP from './utils/SimplePTPComs.js';
;
(async () => {

    //the handle used for all file system interactions
    let folderHandle

    //for the sub folders used for programs
    let playerFolderHandle, savesFolderHandle

    async function deleteFolderChild(handle, relativePath) {
        await handle.removeEntry(relativePath, { recursive: true })
    }

    async function deleteFile(handle) {
        await handle.remove()
    }

    async function createDirectory(parentHandle, dirName) {
        return await parentHandle.getDirectoryHandle(dirName, { create: true })
    }

    async function writefile(handle, content) {
        // Create a writable stream
        const writable = await handle.createWritable()

        // Write the content to the file
        await writable.write(content)

        // Close the file and finish writing
        await writable.close()
    }

    async function createAndWriteFile(parentHandle, fileName, content) {
        // Create a new file or overwrite an existing file in the directory
        const fileHandle = await parentHandle.getFileHandle(fileName, { create: true })

        // Create a writable stream
        const writable = await fileHandle.createWritable()

        // Write the content to the file
        await writable.write(content)

        // Close the file and finish writing
        await writable.close()
    }

    async function readFile(handle) {
        return await (await handle.getFile()).text()
    }

    async function scanFolder(handle) {
        const results = []
        for await (const [name, subHandle] of handle.entries())
            results.push(subHandle)
        return results
    }

    //grab the permissions, and create needed files
    await (async () => {

        //make the user select a folder for the game
        await new Promise(r => document.getElementById('getFolderButton').onclick = async () => {
            try {
                folderHandle = await window.showDirectoryPicker();
            } catch (error) {
                location.reload()
            }
            r()
        })


        //create the playerPrograms / saves folders if needed
        let playerPrograms, saves;
        (await scanFolder(folderHandle)).forEach(file => {
            if (file.name == 'playerPrograms' && file.kind == 'directory') {
                playerPrograms = true
                playerFolderHandle = file
            }
            if (file.name == 'saves' && file.kind == 'directory') {
                saves = true
                savesFolderHandle = file
            }
        })
        if (!playerPrograms)
            playerFolderHandle = await createDirectory(folderHandle, 'playerPrograms')
        if (!saves)
            savesFolderHandle = await createDirectory(folderHandle, 'saves')

    })()

    //remove the button
    document.getElementById('getFolderButton').remove()

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
    let resources = {
        copper_ore: {
            color: '#ef7646',
            richness: 5_000,
            frequency: .2,
            scale: 15
        },
        iron_ore: {
            color: '#aaaaff',
            richness: 5_000,
            frequency: .2,
            scale: 15
        },
        coal: {
            color: '#000000',
            richness: 1_000,
            frequency: .25,
            scale: 30
        },
        lead_ore: {
            color: '#7d3659',
            richness: 5_000,
            frequency: .15,
            scale: 15
        },
        emerald: {
            color: '#00ff00',
            richness: 100,
            frequency: .1,
            scale: 5
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
        Menu.setMaxHeight(canvas.height * .25)
        Menu.setTextSize(Math.floor(canvas.width, canvas.height) / 50)
        Console.maxHeight = canvas.height * .25
        Console.defaultTextSize = Math.floor(canvas.width, canvas.height) / 50
    }
    window.onresize = resize
    resize()

    //keep track of ticking
    let autoTick = false
    let oneTick = false
    let minTickTime = 1
    let autoSaveInterval = 0

    //to read / write, use grid.get / grid.set
    let grid = {
        generate(x, y) {
            let cell = {}
            const distance = Math.sqrt(-x * -x + -y * -y)
            Object.keys(resources).forEach(name => {
                const resource = resources[name]
                const noise = perlinNoise(x / resource.scale, y / resource.scale, resource.seed)
                const frequency = resource.frequency
                if (noise < frequency && distance > 5) {
                    const richness = Math.ceil((1 - noise / frequency) * resource.richness)
                    if ((!cell.resource) || ((!cell.resource) && cell.count < richness))
                        cell = { resource: name, count: richness }
                }
            })
            return cell
        },
        get(x, y) {
            x = Math.round(x)
            y = Math.round(y)
            const cords = `${x}/${y}`
            if (!grid[cords]) {
                const cell = grid.generate(x, y)
                grid[cords] = cell
                return cell
            }
            return grid[cords]
        },
        set(x, y, value) {
            x = Math.round(x)
            y = Math.round(y)
            grid[`${x}/${y}`] = value
        },
        getChanges() {
            const changes = []
            Object.keys(grid).forEach(key => {
                if (typeof grid[key] != 'function') {
                    const [x, y] = key.split('/')
                    if (JSON.stringify(grid[key]) != JSON.stringify(grid.generate(x, y))) {
                        changes.push([key, grid[key]])
                    }
                }
            })
            return changes
        }
    }

    //x / y are for the center, scale is the number of cells to show on the smallest side
    let viewPort = {
        x: 0,
        y: 0,
        scale: 10,
        freeCam: false
    }

    //sets the current bots code, and runs it (ticks once)
    function runBotCode(code, name = 'Unknown') {
        bots[hauntedBotId].programCode = code
        bots[hauntedBotId].programName = name
        oneTick = true
    }

    function setUpHost() {
        SPTP.host.setOnMessage((from, message) => {
            console.log(from, message)
            SPTP.host.sendMessage(from, from)
        })
        document.addEventListener('keypress', event => SPTP.remote.sendMessage(event.key))
    }
    function setUpRemote() {
        SPTP.remote.setOnMessage((from, message) => {
            console.log(from, message)
            SPTP.host.sendMessage(from, from)
        })
    }

    //stuff for multiplayer
    let multiplayerMode = false

    //used for some edge cases with needing new html
    let fullPause = false

    //the color for empty spaces
    const backgroundColor = '#222'

    //setup the console
    Console.ctx = ctx
    Console.defaultFont = 'Silkscreen'

    //setup the menus
    Menu.setCtx(ctx)
    Menu.setMenu('home', {
        items: [
            { text: 'Quick Actions', func() { Menu.open('quick_actions') } },
            { text: 'Toggle Auto Tick', func(parentMenu, self) { autoTick = !autoTick; self.info = `Currently is ${autoTick ? 'on' : 'off'}` }, info: `Currently is ${autoTick ? 'on' : 'off'}` },
            { text: 'Tick', func() { oneTick = true } },
            { text: 'Read Self Info', func() { Menu.open('self_info') } },
            { text: 'Set Self Program', async func() { await Menu.open('set_self_program') } },
            { text: 'Toggle FreeCam', func(parentMenu, self) { viewPort.freeCam = !viewPort.freeCam; self.info = `Currently is ${viewPort.freeCam ? 'on' : 'off'}` }, info: `Currently is ${viewPort.freeCam ? 'on' : 'off'}` },
            { text: 'Create Save File', func: save, info: 'May reload the page' },
            { text: 'Load Save File', async func() { await Menu.open('load_save') } },
            { text: 'Change Minimum Tick Time', func() { Menu.open('min_tick_time') } },
            { text: 'Change Auto Save Interval', func() { Menu.open('auto_save_interval') } },
            { text: 'Multiplayer Actions', func() { Menu.open('multiplayer_connections') } },
            { text: 'Admin Commands', func() { Menu.open('admin') } },
        ],
        onCreate(self) {
            self.items[1].info = `Currently is ${autoTick ? 'on' : 'off'}`
            self.items[5].info = `Currently is ${viewPort.freeCam ? 'on' : 'off'}`
        }
    })
    Menu.setMenu('load_save', {
        title: 'Choose File To Load',
        async onCreate(self) {
            self.items = []
            const scan = await scanFolder(savesFolderHandle)
            scan.forEach(item => {
                self.items.push({
                    text: item.name.split('.')[0],
                    func() { load(item); Menu.back() }
                })
            })
        }
    })
    Menu.setMenu('set_self_program', {
        title: 'Choose new program',
        async onCreate(self) {
            self.items = []
            let dirs = []
            dirs.push(await scanFolder(playerFolderHandle))
            for (let index = 0; index < dirs.length; index++) {
                const dir = dirs[index]
                const scan = await scanFolder(dir)
                scan.forEach(async (handle) => {
                    if (handle.kind == 'directory')
                        dirs.push(handle)
                    else {
                        const path = await playerFolderHandle.resolve(handle)
                        self.items.push({
                            text: path.join('/'),
                            info: handle.name,
                            async func() {
                                bots[hauntedBotId].programCode = await readFile(handle)
                                bots[hauntedBotId].programName = path.join('/')
                                Menu.back()
                            }
                        })
                    }
                })
            }
        }
    })
    Menu.setMenu('self_info', {
        title: 'Last updated on open',
        items: [
            { text: 'x', func(parentMenu, self) { self.info = String(bots[hauntedBotId].x) } },
            { text: 'y', func(parentMenu, self) { self.info = String(bots[hauntedBotId].y) } },
            { text: 'mode', func(parentMenu, self) { self.info = bots[hauntedBotId].mode } },
            { text: 'energy', func(parentMenu, self) { self.info = bots[hauntedBotId].energy } },
            { text: 'program', func(parentMenu, self) { self.info = bots[hauntedBotId].programName } },
            {
                text: 'slot 0', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[0]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 1', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[1]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 2', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[2]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 3', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[3]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 4', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[4]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 5', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[5]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 6', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[6]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 7', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[7]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
            {
                text: 'slot 8', func(parentMenu, self) {
                    const slot = bots[hauntedBotId].inventory[8]
                    if (slot.count == 0) self.info = 'Empty'
                    else self.info = `${slot.count} ${slot.type}`
                }
            },
        ],
        onCreate(self) {
            self.items.forEach(item => item.func(self, item))
        }
    })
    Menu.setMenu('quick_actions', {
        title: 'Items with * cost one tick',
        items: [
            { text: 'Move Self', func() { Menu.open('quick_actions/move_self') }, info: '*' },
            { text: 'Set Self Mode', func() { Menu.open('quick_actions/set_self_mode') }, info: '*' },
            { text: 'Harvest', func() { Menu.open('quick_actions/harvest') }, info: '*' },
            { text: 'Take Items', func() { Menu.open('quick_actions/take_items') }, info: '*' },
            { text: 'Give Items', func() { Menu.open('quick_actions/give_items') }, info: '*' },
            { text: 'Transfer Player Control', func() { Menu.open('quick_actions/transfer_player_control') } },
            { text: 'Burn Coal', func() { bots[hauntedBotId].programCode = `Bot.burnCoal('0')`; bots[hauntedBotId].programName = 'Burn Coal'; oneTick = true }, info: '*' },
            { text: 'Give Energy', func() { Menu.open('quick_actions/give_energy') }, info: '*' },
            { text: 'Craft', func() { Menu.open('quick_actions/craft') }, info: '*' },
            { text: 'Reset Bot Program', func() { bots[hauntedBotId].programCode = ``; bots[hauntedBotId].programName = 'No Program' } },
            { text: 'Reset Bot Mem', func() { bots[hauntedBotId].mem = {} } },
        ]
    })
    Menu.setMenu('quick_actions/move_self', {
        title: 'Choose Move Direction',
        items: [
            { text: 'Up', func() { bots[hauntedBotId].programCode = `Bot.moveSelf('up')`; bots[hauntedBotId].programName = 'Move Up'; oneTick = true } },
            { text: 'Right', func() { bots[hauntedBotId].programCode = `Bot.moveSelf('right')`; bots[hauntedBotId].programName = 'Move Right'; oneTick = true } },
            { text: 'Down', func() { bots[hauntedBotId].programCode = `Bot.moveSelf('down')`; bots[hauntedBotId].programName = 'Move Down'; oneTick = true } },
            { text: 'Left', func() { bots[hauntedBotId].programCode = `Bot.moveSelf('left')`; bots[hauntedBotId].programName = 'Move Left'; oneTick = true } },
        ]
    })
    Menu.setMenu('quick_actions/set_self_mode', {
        title: 'Choose new mode',
        onCreate(self) {
            self.items = [],
                botModes.forEach(mode => {
                    self.items.push({
                        text: mode,
                        func() { bots[hauntedBotId].mode = mode }
                    })
                })
        },
    })
    Menu.setMenu('quick_actions/harvest', {
        title: 'Choose harvest direction',
        items: [
            { text: 'Up', func() { bots[hauntedBotId].programCode = `for(let i = 0; i < 9; i++)Bot.harvest('up',i)`; bots[hauntedBotId].programName = 'Harvest Up'; oneTick = true } },
            { text: 'Right', func() { bots[hauntedBotId].programCode = `for(let i = 0; i < 9; i++)Bot.harvest('right',i)`; bots[hauntedBotId].programName = 'Harvest Right'; oneTick = true } },
            { text: 'Down', func() { bots[hauntedBotId].programCode = `for(let i = 0; i < 9; i++)Bot.harvest('down',i)`; bots[hauntedBotId].programName = 'Harvest Down'; oneTick = true } },
            { text: 'Left', func() { bots[hauntedBotId].programCode = `for(let i = 0; i < 9; i++)Bot.harvest('left',i)`; bots[hauntedBotId].programName = 'Harvest Left'; oneTick = true } },
        ]
    })
    Menu.setMenu('quick_actions/take_items', {
        title: 'Choose direction to take item from',
        items: [
            { text: 'Up', func() { bots[hauntedBotId].programCode = `Bot.takeItems('up',0,0)`; bots[hauntedBotId].programName = 'Take Items Up'; oneTick = true } },
            { text: 'Right', func() { bots[hauntedBotId].programCode = `Bot.takeItems('right',0,0)`; bots[hauntedBotId].programName = 'Take Items Right'; oneTick = true } },
            { text: 'Down', func() { bots[hauntedBotId].programCode = `Bot.takeItems('down',0,0)`; bots[hauntedBotId].programName = 'Take Items Down'; oneTick = true } },
            { text: 'Left', func() { bots[hauntedBotId].programCode = `Bot.takeItems('left',0,0)`; bots[hauntedBotId].programName = 'Take Items Left'; oneTick = true } },
        ]
    })
    Menu.setMenu('quick_actions/give_items', {
        title: 'Choose direction to take item from',
        items: [
            { text: 'Up', func() { bots[hauntedBotId].programCode = `Bot.giveItems('up',0,0)`; bots[hauntedBotId].programName = 'Give Items Up'; oneTick = true } },
            { text: 'Right', func() { bots[hauntedBotId].programCode = `Bot.giveItems('right',0,0)`; bots[hauntedBotId].programName = 'Give Items Right'; oneTick = true } },
            { text: 'Down', func() { bots[hauntedBotId].programCode = `Bot.giveItems('down',0,0)`; bots[hauntedBotId].programName = 'Give Items Down'; oneTick = true } },
            { text: 'Left', func() { bots[hauntedBotId].programCode = `Bot.giveItems('left',0,0)`; bots[hauntedBotId].programName = 'Give Items Left'; oneTick = true } },
        ]
    })
    Menu.setMenu('quick_actions/give_energy', {
        title: 'Choose direction to give energy (gives %75)',
        items: [
            { text: 'Up', func() { bots[hauntedBotId].programCode = `Bot.giveEnergy('up',(await Bot.getSelfInfo()).energy*.75)`; bots[hauntedBotId].programName = 'Give Energy Up'; oneTick = true } },
            { text: 'Right', func() { bots[hauntedBotId].programCode = `Bot.giveEnergy('right',(await Bot.getSelfInfo()).energy*.75)`; bots[hauntedBotId].programName = 'Give Energy Right'; oneTick = true } },
            { text: 'Down', func() { bots[hauntedBotId].programCode = `Bot.giveEnergy('down',(await Bot.getSelfInfo()).energy*.75)`; bots[hauntedBotId].programName = 'Give Energy Down'; oneTick = true } },
            { text: 'Left', func() { bots[hauntedBotId].programCode = `Bot.giveEnergy('left',(await Bot.getSelfInfo()).energy*.75)`; bots[hauntedBotId].programName = 'Give Energy Left'; oneTick = true } },
        ]
    })
    Menu.setMenu('quick_actions/transfer_player_control', {
        title: 'Choose New Bot For Control',
        onCreate(self) {
            self.items = [
                {
                    text: 'Up', func() {
                        const currentBot = bots[hauntedBotId]
                        let newId = grid.get(currentBot.x, currentBot.y - 1).botId
                        if (newId != undefined)
                            hauntedBotId = newId
                    }
                },
                {
                    text: 'Right', func() {
                        const currentBot = bots[hauntedBotId]
                        let newId = grid.get(currentBot.x + 1, currentBot.y).botId
                        if (newId != undefined)
                            hauntedBotId = newId
                    }
                },
                {
                    text: 'Down', func() {
                        const currentBot = bots[hauntedBotId]
                        let newId = grid.get(currentBot.x, currentBot.y + 1).botId
                        if (newId != undefined)
                            hauntedBotId = newId
                    }
                },
                {
                    text: 'Left', func() {
                        const currentBot = bots[hauntedBotId]
                        let newId = grid.get(currentBot.x - 1, currentBot.y).botId
                        if (newId != undefined)
                            hauntedBotId = newId
                    }
                },
            ]
            Object.keys(bots).forEach(id => {
                self.items.push({
                    text: `Bot ${id}`,
                    func() { hauntedBotId = id }
                })
            })
        }
    })
    Menu.setMenu('admin', {
        items: [
            { text: 'Max Out Self Energy', func() { bots[hauntedBotId].energy = energyCapacity } },
            { text: 'Create Bot Above', func() { createBot(bots[hauntedBotId].x, bots[hauntedBotId].y - 1) } },
            {
                text: 'Delete Cell Above', func() {
                    const CB = bots[hauntedBotId]
                    if (grid.get(CB.x, CB.y - 1).botId != undefined) {
                        delete bots[grid.get(CB.x, CB.y - 1).botId]
                    }
                    grid.set(CB.x, CB.y - 1, {})
                }
            },
            { text: 'Clear Inventory', func() { bots[hauntedBotId].inventory = new Array(9).fill(0).map(() => ({ count: 0, type: 'empty' })) } },
        ],
    })
    Menu.setMenu('min_tick_time', {
        items: [
            { text: 'No Delay', func(parentMenu) { minTickTime = 0; parentMenu.onCreate(parentMenu) }, info: '0 Milliseconds' },
            { text: '.01 Seconds', func(parentMenu) { minTickTime = 10; parentMenu.onCreate(parentMenu) }, info: '10 Milliseconds' },
            { text: '.05 Seconds', func(parentMenu) { minTickTime = 50; parentMenu.onCreate(parentMenu) }, info: '50 Milliseconds' },
            { text: '.1 Seconds', func(parentMenu) { minTickTime = 100; parentMenu.onCreate(parentMenu) }, info: '100 Milliseconds' },
            { text: '.25 Seconds', func(parentMenu) { minTickTime = 250; parentMenu.onCreate(parentMenu) }, info: '250 Milliseconds' },
            { text: '.5 Seconds', func(parentMenu) { minTickTime = 500; parentMenu.onCreate(parentMenu) }, info: '500 Milliseconds' },
            { text: '1 Second', func(parentMenu) { minTickTime = 1_000; parentMenu.onCreate(parentMenu) }, info: '1000 Milliseconds' },
            { text: '2 Seconds', func(parentMenu) { minTickTime = 2_000; parentMenu.onCreate(parentMenu) }, info: '2000 Milliseconds' },
            { text: '5 Seconds', func(parentMenu) { minTickTime = 5_000; parentMenu.onCreate(parentMenu) }, info: '5000 Milliseconds' },
            { text: 'Add .001 Seconds', func(parentMenu) { minTickTime += 1; parentMenu.onCreate(parentMenu) }, info: '1 Millisecond' },
            { text: 'Add .01 Seconds', func(parentMenu) { minTickTime += 10; parentMenu.onCreate(parentMenu) }, info: '10 Milliseconds' },
            { text: 'Add .1 Seconds', func(parentMenu) { minTickTime += 100; parentMenu.onCreate(parentMenu) }, info: '100 Milliseconds' },
            { text: 'Subtract .001 Seconds', func(parentMenu) { minTickTime -= 1; parentMenu.onCreate(parentMenu) }, info: '1 Millisecond' },
            { text: 'Subtract .01 Seconds', func(parentMenu) { minTickTime -= 10; parentMenu.onCreate(parentMenu) }, info: '10 Milliseconds' },
            { text: 'Subtract .1 Seconds', func(parentMenu) { minTickTime -= 100; parentMenu.onCreate(parentMenu) }, info: '100 Milliseconds' },
            { text: 'Multiply By 2', func(parentMenu) { minTickTime = minTickTime * 2; parentMenu.onCreate(parentMenu) } },
            { text: 'Multiply By 10', func(parentMenu) { minTickTime = minTickTime * 10; parentMenu.onCreate(parentMenu) } },
            { text: 'Divide By 2', func(parentMenu) { minTickTime = minTickTime / 2; parentMenu.onCreate(parentMenu) } },
            { text: 'Divide By 10', func(parentMenu) { minTickTime = minTickTime / 10; parentMenu.onCreate(parentMenu) } },
        ],
        onCreate(self) {
            minTickTime = Math.max(0, minTickTime)
            if (minTickTime == 1_000)
                self.title = `Current Minimum Tick Time is 1 Second Per Tick`
            else
                self.title = `Current Minimum Tick Time is ${minTickTime / 1000} Seconds Per Tick`
        }
    })
    Menu.setMenu('auto_save_interval', {
        autoSaveIntervalText: '',
        items: [
            { text: 'No Auto Save', func(parentMenu) { autoSaveInterval = 0; parentMenu.autoSaveIntervalText = ''; parentMenu.onCreate(parentMenu) } },
            { text: '5 Seconds', func(parentMenu) { autoSaveInterval = 5_000; parentMenu.autoSaveIntervalText = '5 Seconds'; parentMenu.onCreate(parentMenu) } },
            { text: '30 Seconds', func(parentMenu) { autoSaveInterval = 30_000; parentMenu.autoSaveIntervalText = '30 Seconds'; parentMenu.onCreate(parentMenu) } },
            { text: '1 Minute', func(parentMenu) { autoSaveInterval = 60_000; parentMenu.autoSaveIntervalText = '1 Minute'; parentMenu.onCreate(parentMenu) } },
            { text: '5 Minutes', func(parentMenu) { autoSaveInterval = 300_000; parentMenu.autoSaveIntervalText = '5 Minutes'; parentMenu.onCreate(parentMenu) } },
            { text: '15 Minutes', func(parentMenu) { autoSaveInterval = 900_000; parentMenu.autoSaveIntervalText = ''; parentMenu.onCreate(parentMenu) } },
            { text: '30 Minutes', func(parentMenu) { autoSaveInterval = 1_800_000; parentMenu.autoSaveIntervalText = '30 Minutes'; parentMenu.onCreate(parentMenu) } },
            { text: '1 hour', func(parentMenu) { autoSaveInterval = 3_600_000; parentMenu.autoSaveIntervalText = '1 hour'; parentMenu.onCreate(parentMenu) } },
        ],
        onCreate(self) {
            if (autoSaveInterval == 0)
                self.title = 'Auto Save Is Disabled'
            else
                self.title = `Current Auto Save Interval is every ${self.autoSaveIntervalText}`
        }
    })
    Menu.setMenu('quick_actions/craft', {
        title: 'Choose recipe',
        onCreate(self) {
            self.items = []
            Object.keys(recipes).forEach((recipeName) => {
                self.items.push({
                    text: recipeName,
                    func() { bots[hauntedBotId].programCode = `Bot.craft('${recipeName}',0)`; bots[hauntedBotId].programName = `Craft ${recipeName}`; oneTick = true }
                })
            })
        }
    })
    Menu.setMenu('multiplayer_connections', {
        onCreate(self) {
            if (multiplayerMode === false) {
                self.title = 'Choose Self Mode'
                self.items = [
                    { text: 'Host', func() { multiplayerMode = 'host'; Menu.back(); Menu.open('multiplayer_connections') } },
                    { text: 'Remote', func() { multiplayerMode = 'remote'; Menu.back(); Menu.open('multiplayer_connections') } }
                ]
            } else if (multiplayerMode == 'host') {
                self.title = 'You Are In Host Mode'
                self.items = [
                    {
                        text: 'Get Self Id', func() {
                            if (!fullPause) {
                                fullPause = true
                                let hostId = document.createElement("pre")
                                hostId.innerText = "test id"//SPTP.host.getSelfId()
                                hostId.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; color: green; overflow: auto; margin: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; font-family: 'Silkscreen'; white-space: pre-wrap; text-align: center; font-size: 5vw;";
                                hostId.id = 'hostId'
                                document.body.appendChild(hostId)
                                document.addEventListener('keyup', event => {
                                    if (event.key == 'Enter') {
                                        document.getElementById('hostId').remove()
                                        fullPause = false
                                        setUpHost()
                                    }
                                })
                            }
                        },
                        info: 'press ENTER to exit'
                    },
                ]
            } else {
                self.title = 'You Are In Remote Mode'
                self.items = [
                    {
                        text: 'Connect to Host', func() {
                            if (!fullPause) {
                                fullPause = true
                                let idInput = document.createElement("textarea")
                                idInput.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; color: green; border: none; padding: 10px; box-sizing: border-box; z-index: 1000; font-family: 'Silkscreen', sans-serif; text-align: center; font-size: 5vw;";
                                idInput.id = 'idInput'
                                document.body.appendChild(idInput)
                                document.addEventListener('keyup', event => {
                                    if (event.key == 'Enter') {
                                        SPTP.remote.connect(document.getElementById('idInput').value.split('\n')[0])
                                        document.getElementById('idInput').remove()
                                        fullPause = false
                                        setUpRemote()
                                    }
                                })
                            }
                        },
                        info: 'press ENTER to exit'
                    },
                ]
            }
        }
    })

    //setup the Menu
    Menu.setFont('Silkscreen')
    Menu.setCenterTitle(true)

    //the same stacksize will be used for every item type
    const stackSize = 100

    //setup bot colors
    const botBackgroundColor = '#000'
    const deadBotAccentColor = '#333'
    const botModeColors = {}
    const botModes = [
        'Blank',
        'Harvester',
        'Mobile',
        'Crafter',
        'Builder',
        'Destroyer',
        'Transferer',
        'Energizer',
    ]
    botModes.forEach((mode, index) => {
        const color = Colors.createColor()
        color.saturation = 100
        color.lightness = 50
        color.hue = Math.round(100 / (botModes.length - 1) * index)
        botModeColors[mode] = color.hex
    })
    botModeColors['Blank'] = '#ffffff'


    //how much energy a bot can hold
    const energyCapacity = 1000

    //store the id so no bot will have the same id
    let nextBotId = 0
    let bots = {}
    function createBot(x, y, energy = 0) {
        bots[nextBotId] = {
            mem: {},
            mode: 'Blank',
            programName: 'No program set',
            programCode: '',
            inventory: new Array(9).fill(0).map(slot => ({ type: '', count: 0 })),
            x,
            y,
            id: nextBotId,
            energy
        }
        grid.set(x, y, {
            botId: nextBotId
        })
        nextBotId++
    }

    //this is the bot the player controls / the viewfinder is tied to
    let hauntedBotId = 0

    //you
    createBot(0, 0, energyCapacity)

    async function save() {
        const saveValue = JSON.stringify({
            bots,
            nextBotId,
            grid: grid.getChanges(),
            hauntedBotId,
            resources,
            minTickTime,
            viewPort,
            autoTick
        })
        const now = new Date(Date.now())
        const nowText = `${(new Date().toString().match(/\(([A-Za-z\s].*)\)/)[1]).split(' ').map(value => value[0]).join('')}-${now.getFullYear()}-${now.getMonth()}-${now.getDay()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`
        await createAndWriteFile(savesFolderHandle, `${nowText}.json`, saveValue)
    }

    async function load(handle) {
        try {
            const rawFile = await readFile(handle)
            const saveValue = JSON.parse(rawFile);
            ['bots', 'hauntedBotId', 'nextBotId', 'grid', 'resources', 'minTickTime', 'viewPort', 'autoTick'].forEach(key => {
                if (saveValue[key] == undefined)
                    throw `Missing key ${key}`
            })
            bots = saveValue.bots
            hauntedBotId = saveValue.hauntedBotId
            nextBotId = saveValue.nextBotId
            Object.keys(grid).forEach(key => {
                if (typeof grid[key] != 'function')
                    delete grid[key]
            })
            saveValue.grid.forEach(item => grid[item[0]] = item[1])
            resources = saveValue.resources
            minTickTime = saveValue.minTickTime
            viewPort = saveValue.viewPort
            autoTick = saveValue.autoTick
        } catch (err) {
            console.error(err)
            await deleteFile(handle)
        }
    }

    const runBots = (() => {

        //all bot code will be executed in the worker for speed
        const worker = new Worker('./botRunner.js')

        //it will need to be accessible out here
        let resolvePromise = () => { }

        //secret code to end a bots time, so bots cannot interfere with each other
        let doneCode = ''

        //the bot that should be running code
        let bot = undefined

        //it needs to be out here
        let hasAction

        //to make things more compact
        function cordsAtDir(x, y, dir) {
            if (dir == 'up') return { x, y: y - 1 }
            if (dir == 'right') return { x: x + 1, y }
            if (dir == 'down') return { x, y: y + 1 }
            if (dir == 'left') return { x: x - 1, y }
        }

        //a nice key lookup obj
        const messageFuncs = {
            set_self_mode(mode) {
                if (hasAction && botModes.includes(mode)) {
                    let cost = 0
                    for (let slot = 0; slot < 9; slot++)
                        cost += bot.inventory[slot].count
                    bot.energy -= cost
                    bot.mode = mode
                    hasAction = false
                    return true
                }
                return false
            },
            set_other_mode(dir, mode) {
                if (!bot.mode == 'Builder') return false
                if (!hasAction) return false
                if (!botModes.includes(mode)) return false
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return false
                let cost = 0
                for (let slot = 0; slot < 9; slot++)
                    cost += bots[targetBotId].inventory[slot].count
                bots[targetBotId].mode = mode
                bots[targetBotId].energy -= cost
                return true
            },
            move_self(dir) {
                if (bot.mode != 'Mobile') return false
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
            },
            set_self_mem(mem) {
                bot.mem = mem
                return true
            },
            set_other_mem(dir, mem) {
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                if (grid.get(targetCords.x, targetCords.y).botId != undefined) {
                    bots[grid.get(targetCords.x, targetCords.y).botId].mem = mem
                    return true
                }
                return false
            },
            get_self_info() {
                return bot
            },
            look(dir) {
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return grid.get(targetCords.x, targetCords.y)
                return bots[targetBotId]
            },
            harvest(dir, slot) {
                if (!hasAction || bot.mode != 'Harvester') return false
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetCell = grid.get(targetCords.x, targetCords.y)
                if (targetCell.resource == undefined) return false
                const slotType = bot.inventory[slot].type
                const slotCount = bot.inventory[slot].count
                if (slotCount == stackSize || (slotCount > 0 && slotType != targetCell.resource)) return false
                bot.inventory[slot] = {
                    count: slotCount + 1,
                    type: targetCell.resource
                }
                if (targetCell.count > 1)
                    grid.set(targetCords.x, targetCords.y, { resource: targetCell.resource, count: targetCell.count - 1 })
                else
                    grid.set(targetCords.x, targetCords.y, {})
                hasAction = false
                return true
            },
            move_items(fromSlotIndex, toSlotIndex, maxCount) {
                const fromSlot = bot.inventory[fromSlotIndex]
                const toSlot = bot.inventory[toSlotIndex]
                if (
                    fromSlot.count == 0 ||
                    toSlot.count == stackSize ||
                    (toSlot.count > 0 &&
                        fromSlot.type != toSlot.type)
                ) return 0
                let moveCount = Math.min(
                    maxCount,
                    stackSize,
                    fromSlot.count,
                    stackSize - toSlot.count
                )
                if (fromSlot.count <= moveCount)
                    bot.inventory[fromSlotIndex] = { type: '', count: 0 }
                else
                    bot.inventory[fromSlotIndex].count -= moveCount
                if (toSlot.count == 0)
                    bot.inventory[toSlotIndex] = { count: moveCount, type: fromSlot.type }
                else
                    bot.inventory[toSlotIndex].count += moveCount
                return moveCount
            },
            take_items(dir, fromSlotIndex, toSlotIndex, maxCount) {
                if (bot.mode != 'Transferer') return false
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return 0
                const fromSlot = bots[targetBotId].inventory[fromSlotIndex]
                const toSlot = bot.inventory[toSlotIndex]
                if (
                    fromSlot.count == 0 ||
                    toSlot.count == stackSize ||
                    (toSlot.count > 0 &&
                        fromSlot.type != toSlot.type)
                ) return 0
                let moveCount = Math.min(
                    maxCount,
                    stackSize,
                    fromSlot.count,
                    stackSize - toSlot.count
                )
                if (fromSlot.count <= moveCount)
                    bots[targetBotId].inventory[fromSlotIndex] = { type: '', count: 0 }
                else
                    bots[targetBotId].inventory[fromSlotIndex].count -= moveCount
                if (toSlot.count == 0)
                    bot.inventory[toSlotIndex] = { count: moveCount, type: fromSlot.type }
                else
                    bot.inventory[toSlotIndex].count += moveCount
                return moveCount
            },
            give_items(dir, fromSlotIndex, toSlotIndex, maxCount) {
                if (bot.mode != 'Transferer') return false
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return 0
                const fromSlot = bot.inventory[fromSlotIndex]
                const toSlot = bots[targetBotId].inventory[toSlotIndex]
                if (
                    fromSlot.count == 0 ||
                    toSlot.count == stackSize ||
                    (toSlot.count > 0 &&
                        fromSlot.type != toSlot.type)
                ) return 0
                let moveCount = Math.min(
                    maxCount,
                    stackSize,
                    fromSlot.count,
                    stackSize - toSlot.count
                )
                if (fromSlot.count <= moveCount)
                    bot.inventory[fromSlotIndex] = { type: '', count: 0 }
                else
                    bot.inventory[fromSlotIndex].count -= moveCount
                if (toSlot.count == 0)
                    bots[targetBotId].inventory[toSlotIndex] = { count: moveCount, type: fromSlot.type }
                else
                    bots[targetBotId].inventory[toSlotIndex].count += moveCount
                return moveCount
            },
            move_player_control(target) {
                if (typeof target == 'string') {
                    const targetCords = cordsAtDir(bot.x, bot.y, target)
                    const newId = grid.get(targetCords.x, targetCords.y)
                    if (newId != undefined) {
                        hauntedBotId = newId
                        return true
                    }
                }
                if (typeof target == 'number') {
                    if (bots[target] != undefined)
                        hauntedBotId = target
                    return true
                }
                return false
            },
            is_under_player_control() {
                return bot.id == hauntedBotId
            },
            log(text, color) {
                Console.log({ text: `[Bot ${bot.id}] ${text}`, color })
                return true
            },
            async set_self_program(path) {
                if (!hasAction) return false
                path = path.split('/')
                let currentHandle = playerFolderHandle
                for (let index = 0; index < path.length; index++) {
                    const pathPart = path[index]
                    const scan = await scanFolder(currentHandle)
                    scan.forEach(handle => {
                        if (handle.name == pathPart)
                            currentHandle = handle

                    })
                }
                if (currentHandle.name == path[path.length - 1]) {
                    bot.programCode = await readFile(currentHandle)
                    bot.programName = currentHandle.name
                    return true
                }
                return false
            },
            async set_other_program(dir, path) {
                if (bot.mode != 'Builder') return false
                if (!hasAction) return false
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return false
                path = path.split('/')
                let currentHandle = playerFolderHandle
                for (let index = 0; index < path.length; index++) {
                    const pathPart = path[index]
                    const scan = await scanFolder(currentHandle)
                    scan.forEach(handle => {
                        if (handle.name == pathPart)
                            currentHandle = handle
                    })
                }
                if (currentHandle.name == path[path.length - 1]) {
                    bots[targetBotId].programCode = await readFile(currentHandle)
                    bots[targetBotId].programName = currentHandle.name
                    return true
                }
                return false

            },
            burn_coal(fromSlot, maxBurn) {
                if (bot.mode != 'Energizer') return 0
                if (!hasAction) return 0
                if (bot.energy == energyCapacity) return 0
                const slot = bot.inventory[fromSlot]
                if (slot.type != 'coal') return 0
                if (slot.count == 0) return 0
                const burnAmount = Math.min(
                    Math.round(maxBurn),
                    slot.count,
                    Math.ceil((energyCapacity - bot.energy) / 50)
                )
                if (slot.count == burnAmount)
                    bot.inventory[fromSlot] = { type: 'empty', count: 0 }
                else
                    bot.inventory[fromSlot].count -= burnAmount
                bot.energy = Math.min(energyCapacity, bot.energy + burnAmount * 50)
                return burnAmount
            },
            give_energy(dir, maxEnergy) {
                if (bot.mode != 'Energizer') return 0
                if (!hasAction) return 0
                const targetCords = cordsAtDir(bot.x, bot.y, dir)
                const targetBotId = grid.get(targetCords.x, targetCords.y).botId
                if (targetBotId == undefined) return 0
                const givenEnergy = Math.round(Math.min(
                    energyCapacity - bots[targetBotId].energy,
                    bot.energy,
                    Math.max(0, maxEnergy)
                ))
                bot.energy -= givenEnergy
                bots[targetBotId].energy += givenEnergy
                return givenEnergy
            },
            craft(recipeName, toSlot) {
                if (!hasAction) return false
                if (!bot.mode == 'Crafter') return false
                const recipe = recipes[recipeName]
                if (recipe == undefined) return false
                let inventory = bot.inventory
                let canCraft = true
                recipe.forEach((item, index) => {
                    if (item != 0) {
                        if (!(inventory[index].type == item &&
                            inventory[slot].count > 0))
                            canCraft = false
                    }
                })
                if (!canCraft) return false
                if (
                    (inventory[toSlot].count - recipe[toSlot] != 0 ? 1 : 0) != 0 &&
                    !(inventory[toSlot].type == recipeName && (inventory[toSlot].count - recipe[toSlot] != 0 ? 1 : 0) < stackSize)
                ) return false
                recipe.forEach((item, index) => {
                    if (item != 0) {
                        bot[inventory][index].count--
                        if (inventory[index].count == 0)
                            bot[inventory][index].type = ''
                    }
                })
                if (inventory[toSlot].type == recipeName)
                    bot[inventory][toSlot].count++
                else
                    bot[inventory][toSlot] = { type: recipeName, count: 1 }
                return true
            },
            // placeBot()
        }

        //handle all the messages
        worker.onmessage = async (m) => {
            if (bot != undefined) {
                const message = m.data
                const command = message[0]
                const args = message.splice(1)
                if (command == doneCode)
                    resolvePromise()
                else if (messageFuncs[command] != undefined) {
                    let result = 'CRASH'
                    try {
                        result = await messageFuncs[command](...args)
                    } catch (err) {
                        console.error(err)
                    }
                    worker.postMessage(result)
                }
            }
        }

        //hold this to speed stuff up
        const bigTen = Math.pow(10, 10)
        return async () => {
            const botIds = Object.keys(bots)
            for (let index = 0; index < botIds.length; index++) {
                const botId = botIds[index]
                bot = bots[botId]
                if (bot.energy > 0) {
                    hasAction = true
                    doneCode = Math.floor(Math.random() * bigTen)
                    worker.postMessage({ key: doneCode, code: bot.programCode, type: 'keyPass' })
                    await new Promise(async (resolve) => resolvePromise = resolve)
                    if (!hasAction) bot.energy--
                } else
                    bot.mode = 'Blank'
            }
            bot = undefined
        }
    })()


    //renders the grid stuff
    function renderGrid() {

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
        const twoPi = Math.PI * 2
        const gapOffset = cellSize * .2
        const radius = halfCellSize * .35

        //glowing layer gets drawn last
        let glowSpots = []

        const radiusRatio = cellSize * 5 / energyCapacity

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
                    const bot = bots[cell.botId]
                    const centerX = middleX + (x - viewPort.x) * cellSize
                    const centerY = middleY + (y - viewPort.y) * cellSize
                    if (bot.energy > 0) {
                        ctx.strokeStyle = botModeColors[bot.mode]
                        glowSpots.push({
                            x: centerX,
                            y: centerY,
                            color: ctx.strokeStyle,
                            radius: radiusRatio * bot.energy + cellSize
                        })
                    } else
                        ctx.strokeStyle = deadBotAccentColor
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
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.arc(centerX, centerY, radius, 0, twoPi)
                    ctx.stroke()
                }
            }

        //render all the glow spots
        glowSpots.forEach(spot => {
            const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius / 2)
            grad.addColorStop(0, `${spot.color.slice(0, 7)}66`)
            grad.addColorStop(1, `${spot.color.slice(0, 7)}00`)
            ctx.fillStyle = grad
            ctx.fillRect(spot.x - spot.radius / 2, spot.y - spot.radius / 2, spot.radius, spot.radius)
        })
    }

    //listen for keys
    let currentKeys = []
    document.addEventListener('keyup', event => {
        while (currentKeys.includes(event.key))
            currentKeys.splice(currentKeys.indexOf(event.key), 1)
    })
    document.addEventListener('keydown', event => {
        if (!currentKeys.includes(event.key))
            currentKeys.push(event.key)
    })
    document.addEventListener('keypress', (event) => {
        if (clickShortcuts[event.key] && Menu.getStack().length == 0)
            clickShortcuts[event.key](event)
    })

    const holdShortcuts = {
        e() {
            viewPort.scale = Math.max(viewPort.scale * .99, .1)
        },
        q() {
            viewPort.scale *= 1.01
        },
        w() {
            if (viewPort.freeCam)
                viewPort.y -= viewPort.scale * .01
            else if (Date.now() - lastTick >= minTickTime) {
                if (bots[hauntedBotId].mode == 'Mobile')
                    runBotCode(`await Bot.moveSelf('up')`, 'Move Self Up')
                else if (bots[hauntedBotId].mode == 'Harvester')
                    runBotCode(`for(let i=0;i<9;i++)await Bot.harvest('up',i)`)
            }
        },
        d() {
            if (viewPort.freeCam)
                viewPort.x += viewPort.scale * .01
            else if (Date.now() - lastTick >= minTickTime) {
                if (bots[hauntedBotId].mode == 'Mobile')
                    runBotCode(`await Bot.moveSelf('right')`, 'Move Self Right')
                else if (bots[hauntedBotId].mode == 'Harvester')
                    runBotCode(`for(let i=0;i<9;i++)await Bot.harvest('right',i)`)
            }
        },
        s() {
            if (viewPort.freeCam)
                viewPort.y += viewPort.scale * .01
            else if (Date.now() - lastTick >= minTickTime) {
                if (bots[hauntedBotId].mode == 'Mobile')
                    runBotCode(`await Bot.moveSelf('down')`, 'Move Self Down')
                else if (bots[hauntedBotId].mode == 'Harvester')
                    runBotCode(`for(let i=0;i<9;i++)await Bot.harvest('down',i)`)
            }
        },
        a() {
            if (viewPort.freeCam)
                viewPort.x -= viewPort.scale * .01
            else if (Date.now() - lastTick >= minTickTime) {
                if (bots[hauntedBotId].mode == 'Mobile')
                    runBotCode(`await Bot.moveSelf('left')`, 'Move Self Left')
                else if (bots[hauntedBotId].mode == 'Harvester')
                    runBotCode(`for(let i=0;i<9;i++)await Bot.harvest('left',i)`)
            }
        },
    }
    const clickShortcuts = {
        f() { viewPort.freeCam = !viewPort.freeCam },
        m() { Menu.open('quick_actions/set_self_mode') },
        p() { Menu.open('set_self_program') },
        i() { Menu.open('self_info') },
        t() { Menu.open('min_tick_time') },
        c() { Menu.open('multiplayer_connections') },
        b() { if (bots[hauntedBotId].mode == 'Energizer') runBotCode('for (let i=0;i<9;i++)await Bot.burnCoal(i)') },
        ' '() { autoTick = !autoTick },

    }

    //the game loop
    let lastTick = Date.now()
    let lastAutoSave = Date.now()
    async function tick() {
        if (!fullPause) {
            if (Date.now() - lastAutoSave >= autoSaveInterval && autoSaveInterval != 0) {
                Console.log({ text: 'Starting Autosave', color: '#0ff' })
                await save()
                Console.log({ text: 'Autosave Complete', color: '#0ff' })
                lastAutoSave = Date.now()
            }

            if (Menu.getStack().length == 0) {
                currentKeys.forEach(key => {
                    if (holdShortcuts[key])
                        holdShortcuts[key](Date.now() - lastTick)
                })
            }

            if ((autoTick || oneTick) && Date.now() - lastTick >= minTickTime) {
                console.log('tick')
                oneTick = false
                await runBots()
                lastTick = Date.now()
            }

            if (!viewPort.freeCam) {
                viewPort.x = bots[hauntedBotId].x
                viewPort.y = bots[hauntedBotId].y
            }

            renderGrid()
            Menu.render()
            Console.render(canvas.height * .2, 20)
        }
        setTimeout(tick, 0)
    }
    tick()
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
            [5, 'copper_ore_ore'],
            [0], (any slot with zero count is empty)
            [10, 'gear']
        ],
        mode: 'Harvester',
        programName: 'Hello World.js'
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
    
    Todo:
    ~ add tech
    ~ add crafting
    ~ make the game downloadable
    ~ add settings
    ~ make the browser remember file permissions
    ~ make the host id copy to the clipboard
     */
})()