// self.onmessage = (message) => {
//     const programs = JSON.parse(message.data)
//     Object.keys(programs).forEach(botId => {
//         try { new Function(programs[botId])(botId) }
//         catch (err) { console.error(`Error running program ${botId}:\n${err}`) }
//     })
//     self.postMessage('DONE')
// }


const sleep = async (time) => new Promise(r => setTimeout(r, time))

const waitForMessage = async () => {
    let waiting = true
    let message
    while (waiting) {
        self.onmessage = (m) => {
            message = m.data
            waiting = false
        }
        await sleep(0)
    }
    return message
}

    ;
(async () => {
    self.postMessage(0)
    while (true) self.postMessage(await waitForMessage())
})()