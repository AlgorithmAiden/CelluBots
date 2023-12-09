const mem = (await Bot.look('right')).mem
await Bot.setOtherMem('right', mem > 0 ? mem + 1 : 1)
