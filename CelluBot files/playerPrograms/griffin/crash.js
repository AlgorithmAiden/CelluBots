let info = (await Bot.getSelfInfo())
let nX = info.x != -9
let nY = info.y != 17
await Bot.setSelfMem(info.mem == null ? 1 : info.mem + 1)

//if (info.mem < 5) {
    if (nX || nY) {
        if (info.mode != "Mobile") Bot.setSelfMode("Mobile")
        if (info.x < -9) {
            await Bot.moveSelf("left")
        } else {
            await Bot.moveSelf("right")
        }
        
        if (info.y > 17) {
            await Bot.moveSelf("up")
        } else {
            await Bot.moveSelf("down")
        }
    } else {
        await Bot.setSelfMode("Harvest")
    }
//}