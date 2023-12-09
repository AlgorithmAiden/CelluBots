const me = await Bot.getSelfInfo()
if (me.mode == 'Mobile') {
    if ((await Bot.look('left')).resource != undefined) {
        await Bot.setSelfMode('Harvester')
    } else {
        await Bot.moveSelf('left')
    }
} else if (me.mode == 'Harvester') {
    if ((await Bot.look('left')).resource == undefined) {
        await Bot.setSelfMode('Mobile')
    } else {
        await Bot.harvest('left', 0)
    }
} else {
    await Bot.setSelfMode('Mobile')
}
