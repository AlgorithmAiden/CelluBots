const mem = (await Bot.getSelfInfo()).mem
const step = mem.step ?? 0

const stepFuncs = [
    async () => { await Bot.giveEnergy('right', 900) },
    async () => { await Bot.burnCoal(0) },
    async () => { await Bot.giveEnergy('down', 900) },
    async () => { await Bot.burnCoal(1) },
]

if (step < stepFuncs.length)
    await stepFuncs[step]()
await Bot.setSelfMem({ ...mem, step: step + 1 })