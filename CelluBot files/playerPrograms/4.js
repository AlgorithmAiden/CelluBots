const self = await Bot.getSelfInfo()
if (self.mode != 'Transferer')
    await Bot.setSelfMode('Transferer')
else {
    for (let index = 0; index < 9; index++)
        await Bot.takeItems('left', 0, index)
}