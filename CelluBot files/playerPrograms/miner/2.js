const self = await Bot.getSelfInfo()
if ((await Bot.look('left')).botId == undefined && self.inventory[0].count == 0) {
    if (self.mode != 'Mobile')
        await Bot.setSelfMode('Mobile')
    else
        await Bot.moveSelf('left')
} else {
    if (self.mode != 'Transferer')
        await Bot.setSelfMode('Transferer')
    else {
        if (self.inventory[0].count == 0)
            await Bot.takeItems('left', 0, 0)
        else
            await Bot.giveItems('right', 0, 0)
    }
}