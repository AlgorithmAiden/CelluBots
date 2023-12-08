const code = `aw`;
(new Function(
    `(async ()=>{
                try {
                await ${code}.then(()=>{
                    console.log('done')
                })
            } catch (err) {
                console.log(5)
                console.log('done')
            }
            })()
        `
))()
console.log(4)