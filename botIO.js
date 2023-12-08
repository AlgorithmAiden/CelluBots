const getBotIO = (() => {
    let lastMessage = ''
    let hasReceivedReply = false
    let resolve = () => { }
    self.onmessage = (m) => {
        if (m.data.type != 'keyPass')
            console.log('Worker received: ', m.data)
        lastMessage = m.data
        hasReceivedReply = true
        resolve()
    }
    async function runCommand(command) {
        hasReceivedReply = false
        console.log('Worker sent:', command)
        self.postMessage(command)
        await new Promise(r => resolve = r)
        console.log('Returning:', lastMessage)
        return lastMessage
    }

    return () => {
        return {
            async setSelfMode(mode) {
                return await runCommand(['set_self_mode', mode])
            },
            async moveSelf(dir) {
                return await runCommand(['move_self', dir])
            },
            async getSelfMem() {
                return await runCommand(['get_self_mem'])
            },
            async setSelfMem(mem) {
                return await runCommand(['set_self_mem', mem])
            },
        }
    }
})()