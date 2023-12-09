if ((await Bot.getSelfInfo()).mode != 'Builder') await Bot.setSelfMode('Builder')
await Bot.setOtherProgram('right', 'rainbow.js')