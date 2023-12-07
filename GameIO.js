const sendMessage = (m) => self.postMessage(m)
const sleep = async (time) => new Promise(r => setTimeout(r, time))
const waitForMessage = async () => {
    let waiting = true
    let message
    while (waiting) {
        self.onmessage = (m) => {
            message = m.data
            return
        }
        await sleep(0)
    }
    return message
}
