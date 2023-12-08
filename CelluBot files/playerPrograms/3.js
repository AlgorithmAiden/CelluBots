const self = await Bot.getSelfInfo()
if (self.mode == 'Mobile') {
    if (self.inventory[0].count > 0)
        await Bot.moveSelf('right')
    else
        await Bot.moveSelf('left')
} else
    await Bot.setSelfMode('Mobile')