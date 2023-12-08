if (Math.random() < .1)
    this.postMessage(['changeMode', [
        'Harvester',
        'Mobile',
        'Crafter',
        'Builder',
        'Destroyer',
        'Transferer'
    ][Math.floor(Math.random() * 6)]])