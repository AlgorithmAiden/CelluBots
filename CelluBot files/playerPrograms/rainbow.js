if (Math.random() < .01)
    await Bot.setSelfMode([
        'Harvester',
        'Mobile',
        'Crafter',
        'Builder',
        'Destroyer',
        'Transferer',
    ][Math.floor(Math.random() * 6)])