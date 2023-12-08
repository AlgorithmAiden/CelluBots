const BotCode = `
const Bot = (() => {
    let lastMessage = ''
    let resolve = () => { }
    self.onmessage = (m) => {
        if (m.data.type != 'keyPass') {
            lastMessage = m.data
            resolve()
        }
    }
    async function runCommand(command) {
        self.postMessage(command)
        await new Promise(r => resolve = r)
        return lastMessage
    }

    return {

        async setSelfMode(mode) {
            return await runCommand(['set_self_mode', mode])
        },
        async moveSelf(dir) {
            return await runCommand(['move_self', dir])
        },
        async setSelfMem(mem) {
            return await runCommand(['set_self_mem', mem])
        },
        async setOtherMem(dir, mem) {
            return await runCommand(['set_other_mem', mem])
        },
        async getSelfInfo() {
            return await runCommand(['get_self_info'])
        },
        async look(dir) {
            return await runCommand(['look', dir])
        },
        async harvest(dir, slot) {
            return await runCommand(['harvest', dir, slot])
        },
        async moveItems(fromSlot, toSlot, maxCount = Infinity) {
            return await runCommand(['move_items', fromSlot, toSlot, maxCount])
        },
        async takeItems(dir, fromSlot, toSlot, maxCount = Infinity) {
            return await runCommand(['take_items', dir, fromSlot, toSlot, maxCount])
        },
        async giveItems(dir, fromSlot, toSlot, maxCount = Infinity) {
            return await runCommand(['give_items', dir, fromSlot, toSlot, maxCount])
        },
        async movePlayerControl(dir) {
            return await runCommand(['move_player_control', dir])
        },
        async inUnderPlayerControl() {
            return await runCommand(['is_under_player_control'])
        },
    
    }
})()
`
self.addEventListener('message', (m) => {
    const message = m.data
    if (message.type == 'keyPass') {
        (new Function(
            `
            ${BotCode};
                (async ()=>{
                    try {
                    await (async()=>{${message.code}})().then(() => {
                        self.postMessage([${message.key}])
                    })
                } catch(err) {
                    console.error('Error running code:', err)
                    self.postMessage([${message.key}])
                }
                })()
            `
        ))()
    }
})