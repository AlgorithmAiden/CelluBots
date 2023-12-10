# CelluBots
To interact with the game from the code, use 'Bot.' syntax (it will be given to your program on run)

Each tick each bot will be given one 'Action Point'
These points do not save, each bot has a max of 1 at any point 

There are several bot 'modes', each mode has unique functions only it can do, and a bots color is equivalent to its mode

List of modes: 
    ~ Blank: does nothing
    ~ Harvester: can harvest resources
    ~ Mobile: can move
    ~ Crafter: can craft
    ~ Builder: can change other bots program + build bots
    ~ Destroyer: can destroy resource nodes + pick up bots + destroy items
    ~ Transferer: can transfer items from bot to bot
    ~ Energizer: can burn coal to create energy, and distribute it

Each bot has several values, below is an example bot:
{
    energy: 201,
    x: 3,
    y: 2,
    mem: {},
    botId: 12, //every bot has its own id
    mode: 'Mobile',
    programName: 'Hello.js',
    programCode: `console.log('Hello World!')`,
    inventory: [
        {count: 0, type: ''},
        {count: 1, type: 'iron'},
        {count: 0, type: ''},
        {count: 1, type: 'iron'},
        {count: 0, type: ''},
        {count: 1, type: 'iron'},
        {count: 0, type: ''},
        {count: 1, type: 'iron'},
        {count: 0, type: ''},
    ]
}

Bots are run in the order they are created, or from smallest id to largest

The commands are as follows:
(CB: Current Bot (the bot running the code))
(CM: Current Mode (the mode of the bot running the code))
(*: costs an action point)
([X]: can only run if CM is X, if CM is not X the function will return false)

setSelfMode(mode) * :
~ if mode is a valid mode, sets CM to mode
~ costs 1 energy per held item
~ returns true if mode is a valid mode

setOtherMode(dir, mode) * [Builder] :
~ sets the mode to the bot at dir to mode, if there is a bot at dir
~ returns true if there is a bot at dir

moveSelf(dir) * [Mobile] :
~ if the space is empty at dir, it will move CB 1 space
~ returns true if the move succeeds

setSelfMem(mem):
~ sets the mem of CB

setOtherMem(dir, mem):
~ sets the mem of any bot at dir
~ returns true if there is a bot at dir

getSelfInfo():
~ returns all the info about CB (x, y, botId, mode, programName, programCode, inventory, mem)

look(dir):
~ returns all the info about the cell at dir

harvest(dir, toSlot) * [Harvester] :
~ if there is a resource at dir, and there is space in toSlot, one will be mined

moveItems(fromSlot, toSlot, maxCount):
~ tries to move items from fromSlot to toSlot, a max of maxCount items will be moved
~ returns the number of items moved

takeItems(dir, fromSlot, toSlot, maxCount) * [Transferer] :
~ tries to move items from the bot at dir's fromSlot to toSlot, a max of maxCount items will be moved
~ returns the number of items moved

giveItems(dir, fromSlot, toSlot, maxCount) * [Transferer] :
~ tries to move items from fromSlot to the bot at dir's toSlot, a max of maxCount items will be moved
~ returns the number of items moved

movePlayerControl(dir / id):
~ if the input is a string, it is treated as a dir
~ if it is a number, it is treated as an id
~ if the cell at dir is a bot, and CB has player control, then player control will be moved to the bot at dir
~ if the id is a valid id (meaning there is a bot with said id), then player control changes to bot id
~ returns true if player control was moved

isUnderPlayerControl:
~ returns true is CB is is under player control

log(text, color):
~ logs the text to the Console (not to be confused with the console)

setSelfProgram(path) * :
~ the path is relative to the playerPrograms folder
~ the path is case sensitive
~ eg: 'drones/miners/test1.js'
~ sets CB's program to the current code at path, if path is valid
~ returns true if path is valid

setOtherProgram(dir, path) * [Builder] :
~ path structure is the same as setSelfProgram's path structure
~ sets bot at dir's program to the current code at path, if path is valid
~ returns true if path is valid and there is a bot at dir

burnCoal(fromSlot, maxBurn = Infinity) * [Energizer] :
~ burns enough coal to fill up CB's energy at a ratio of 1 coal: 50 energy
~ will only burn as much coal as needed (rounding up)
~ will not burn more than maxBurn
~ returns the amount of coal burned

giveEnergy(dir, maxEnergy) * [Energizer] :
~ gives up to maxEnergy to the bot at dir
~ returns the amount of energy given