const me = await Bot.getSelfInfo()
if (me.mode != 'Mobile') await Bot.setSelfMode('Mobile')
let last
if (typeof me.mem == 'number') last = me.mem
else last = -1
if (last == 0) await Bot.moveSelf('up')
if (last == 1) await Bot.moveSelf('left')
if (last == 2) await Bot.moveSelf('down')
if (last == 3) await Bot.moveSelf('right')
Bot.setSelfMem((last + 1) % 4) 