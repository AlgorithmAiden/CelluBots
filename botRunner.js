self.onmessage = (message) => {
    try { new Function('Bot', message.data.code)() }
    catch (err) { console.error(`Error running program ${message.data.code}:\n${err}`) }
    self.postMessage([message.data.key])
}