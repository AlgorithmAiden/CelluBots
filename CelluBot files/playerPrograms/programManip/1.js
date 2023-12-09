const mem = (await Bot.getSelfInfo()).mem
const step = mem.step ?? 0
let mode = mem.mode ?? [
    'Harvester',
    'Mobile',
    'Crafter',
    'Builder',
    'Destroyer',
    'Transferer',
][Math.floor(Math.random() * 6)]

const stepFuncs = [
    async () => { await Bot.setSelfMode('Builder'); mode = undefined },
    async () => { await Bot.setOtherMode('right', mode) },
    async () => { await Bot.setOtherMode('down', mode) },
    async () => { await Bot.setSelfMode('Mobile') },
    async () => { await Bot.moveSelf('left') },
    async () => { await Bot.moveSelf('down') },
    async () => { await Bot.moveSelf('down') },
    async () => { await Bot.moveSelf('right') },
    async () => { await Bot.moveSelf('right') },
    async () => { await Bot.setSelfMode('Builder') },
    async () => { await Bot.setOtherMode('up', mode) },
    async () => { await Bot.setSelfMode('Mobile') },
    async () => { await Bot.moveSelf('left') },
    async () => { await Bot.moveSelf('left') },
    async () => { await Bot.moveSelf('up') },
    async () => { await Bot.moveSelf('up') },
    async () => { await Bot.moveSelf('right') },
    async () => { await Bot.setSelfMode(mode) },
]

if (step < stepFuncs.length)
    await stepFuncs[step]()
await Bot.setSelfMem({ ...mem, mode, step: (step + 1) % 100 })