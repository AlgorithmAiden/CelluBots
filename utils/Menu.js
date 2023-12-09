export let ctx
export let defaultMenu = 'home'
export let backgroundColor = '#000'
export let invalidColor = '#f00'
export let normalColor = '#fff'
export let correctColor = '#0f0'
export let highlightedColor = '#fff6'
export let titleColor = '#66f'
export let infoColor = '#0ff'
export let inputColor = '#0f0'
export let centerTitle = false
export let padding = 0
export let maxHeight = canvas.height * .2
export let font = 'Times New Roman'
export let textSize = 20
export let menus = {}
export let stack = []
export let input = ''
export let selected = ''
/**
 * Go back one menu
 */
export function back() {
    if (stack > 1) {
        const newMenu = menus[stack(stack.length - 1)]
        if (newMenu.onCreate)
            newMenu.onCreate(newMenu)
    }
    stack.pop()
    input = ''
    selected = ''
}
/**
 * Open a menu
 * @param {string} name 
 */
export async function open(name) {

    //check if it is a valid menu
    if (Object.keys(menus).includes(name)) {

        //add the new menu to the stack
        stack.push(name)

        //grab the new menu
        const newMenu = menus[name]

        //run the onCreate export function, if applicable
        if (newMenu.onCreate)
            try {
                await newMenu.onCreate(newMenu)
            } catch (err) {
                console.error(err)
            }

        //reset input / selected
        input = ''
        selected = ''
    }
}
/**
 * For use with auto key inputs
 * @param {string} key 
 * @param {string} mode 
 * @param {object} event 
 */
export async function handleKey(key, mode, event) {

    //prevent bugs caused by no menus
    if (menus.length == 0) return

    //prevent tabbing
    if (key == 'Tab') event.preventDefault()

    //open the default menu if any arrow key or escape is pressed and the menu is closed
    if (mode == 'up' && stack.length == 0 && ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Escape'].includes(key)) {
        await open(defaultMenu)
    }

    //when left arrow is released remove the last char from input, or go back a menu if input is empty
    else if (mode == 'up' && key == 'ArrowLeft') {
        if (input.length > 0)
            input = input.slice(0, input.length - 1)
        else
            back()
    }

    //when right arrow is released add the next char of selected to input if selected is a valid text, if selected equals input count as enter
    else if (mode == 'up' && key == 'ArrowRight') {
        if (selected.length > 0) {
            if (selected.toLocaleLowerCase() == input.toLocaleLowerCase()) {
                handleKey('Enter', 'up', event)
            } else if (input.toLocaleLowerCase() == selected.toLocaleLowerCase().slice(0, input.length)) {
                input += selected[input.length]
            }
        }
    }

    //use up / down arrows to move selected
    else if (mode == 'up' && (key == 'ArrowUp' || key == 'ArrowDown')) {

        //sort the items
        let invalidItems = []
        let correctItems = []
        menus[stack[stack.length - 1]].items.forEach(item => {
            const lowerText = item.text.toLocaleLowerCase()
            if (lowerText.length < input.length || lowerText.slice(0, input.length) != input.toLocaleLowerCase())
                invalidItems.push(item.text)
            else
                correctItems.push(item.text)
        })

        //merge the items
        let items = [...correctItems, ...invalidItems]

        //find where the selected item is
        let selectedIndex

        //if nothing is selected set index to -1
        if (selected == '')
            selectedIndex = -1
        else
            //or find the selected items index
            items.forEach((text, index) => {
                if (text == selected)
                    selectedIndex = index
            })

        //check for movement direction
        if (key == 'ArrowUp') {

            //if there is an item above, select it, otherwise select nothing
            if (selectedIndex > 0)
                selected = items[selectedIndex - 1]
            else
                selected = ''
        } else {

            //if there is an item below select it
            if (selectedIndex < items.length - 1)
                selected = items[selectedIndex + 1]
        }
    }

    //if backspace remove one char from the input
    else if (key == 'Backspace' && mode == 'up') {
        input = input.slice(0, -1)
    }

    //on enter run the export function for input, or if there is no input run the export function for selected
    else if (mode == 'up' && key == 'Enter') {

        //don't run if there is no open menu
        if (stack.length > 0) {

            //hold the menu
            const currentMenu = menus[stack[stack.length - 1]]

            //check for input
            if (input.length > 0) {

                //find and run the export function for input
                currentMenu.items.forEach(item => {
                    if (item.text.toLocaleLowerCase() == input.toLocaleLowerCase())
                        item.func(currentMenu, item)
                })
            } else {

                //find and run the export function for selected
                currentMenu.items.forEach(item => {
                    if (item.text == selected)
                        item.func(currentMenu, item)
                })
            }
        } else {
            await open(defaultMenu)
        }
    }

    //on tab if anything is selected, set input to selected
    else if (key == 'Tab' && mode == 'up' && selected.length > 0) {
        input = selected
    }

    //if delete reset the input
    else if (key == 'Delete') {
        input = ''
    }

    //Escape will exit the current menu
    else if (key == 'Escape' && mode == 'up') {
        back()
    }

    //add the key to input
    else if (mode == 'press' && key && !['Enter'].includes(key)) {
        input += key
    }
}
/**
 * Renders the current menu at the top of the screen
 */
export function render() {

    //only run if a menu is open
    if (stack.length > 0) {

        //save the max height for shrinking
        let localMaxHeight = maxHeight

        //hold the menu
        const currentMenu = menus[stack[stack.length - 1]]

        let topY = 0
        if (input.length > 0) topY += textSize
        if (currentMenu.title) topY += textSize

        //offset the lines if there is any chars typed
        let regularGrad = ctx.createLinearGradient(0, topY, 0, localMaxHeight)
        regularGrad.addColorStop(0, '#0000')
        regularGrad.addColorStop(.001, normalColor)
        regularGrad.addColorStop(.999, normalColor)
        regularGrad.addColorStop(1, '#0000')
        let correctGrad = ctx.createLinearGradient(0, topY, 0, localMaxHeight)
        correctGrad.addColorStop(0, '#0000')
        correctGrad.addColorStop(.001, correctColor)
        correctGrad.addColorStop(.999, correctColor)
        correctGrad.addColorStop(1, '#0000')
        let invalidGrad = ctx.createLinearGradient(0, topY, 0, localMaxHeight)
        invalidGrad.addColorStop(0, '#0000')
        invalidGrad.addColorStop(.001, invalidColor)
        invalidGrad.addColorStop(.999, invalidColor)
        invalidGrad.addColorStop(1, '#0000')
        let infoGrad = ctx.createLinearGradient(0, topY, 0, localMaxHeight)
        infoGrad.addColorStop(0, '#0000')
        infoGrad.addColorStop(.001, infoColor)
        infoGrad.addColorStop(.999, infoColor)
        infoGrad.addColorStop(1, '#0000')
        

        //shrink the menu if it is larger than needed
        localMaxHeight = Math.min(
            localMaxHeight,
            currentMenu.items.length * textSize + topY
        )

        //draw the background
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, localMaxHeight)

        //ensure the text baseline is correct
        ctx.textBaseline = 'top'

        //set the font
        ctx.font = `${textSize}px ${font}`

        //render the input
        if (input.length > 0) {
            ctx.fillStyle = inputColor
            ctx.fillText(Date.now() % 1000 < 500 ? `${input}_` : input, 0, topY - textSize)
        }

        //sort the items
        let correctItems = []
        let invalidItems = []
        currentMenu.items.forEach(item => {
            const lowerText = item.text.toLocaleLowerCase()
            if (lowerText.length < input.length || lowerText.slice(0, input.length) != input.toLocaleLowerCase())
                invalidItems.push(item)
            else
                correctItems.push(item)
        })
        const allItems = [...correctItems, ...invalidItems]

        //render the title
        if (currentMenu.title) {
            ctx.fillStyle = titleColor
            if (centerTitle)
                ctx.fillText(currentMenu.title, (canvas.width - ctx.measureText(currentMenu.title).width) / 2, 0)
            else
                ctx.fillText(currentMenu.title, padding, 0)
        }

        //ignore case
        const lowerInput = input.toLocaleLowerCase()

        //offset the y if anything is inputted
        let y = input.length > 0 ? textSize : 0

        //find where the selected item is
        let selectedIndex

        //if nothing is selected set index to -1
        if (selected == '')
            selectedIndex = 0
        else
            //or find the selected items index
            allItems.forEach((item, index) => {
                if (item.text == selected)
                    selectedIndex = index
            })


        // handle scrolling
        y = -Math.min(
            Math.max(
                selectedIndex * textSize - topY - localMaxHeight / 2,
                -topY
            ),
            Math.max(
                currentMenu.items.length * textSize - localMaxHeight,
                -topY
            ),
        )

        //render the items
        allItems.forEach(item => {

            //only run if it will be seen
            if (y >= -textSize && y <= localMaxHeight) {

                //render the info if any
                if (item.info) {
                    ctx.fillStyle = infoGrad
                    ctx.fillText(item.info, canvas.width - ctx.measureText(item.info).width - padding, y)
                }

                //hold the text
                const text = item.text

                //highlight if needed
                if (text == selected) {
                    ctx.fillStyle = highlightedColor
                    ctx.fillRect(0, y, canvas.width, Math.min(localMaxHeight - y, textSize))
                }

                //break into the two parts
                const first = text.slice(0, input.length)
                const second = text.slice(input.length)

                //render both parts
                if (first.toLocaleLowerCase() == lowerInput) ctx.fillStyle = correctGrad
                else ctx.fillStyle = invalidGrad
                ctx.fillText(first, padding, y)
                ctx.fillStyle = regularGrad
                ctx.fillText(second, padding + ctx.measureText(first).width, y)
            }

            //offset the next line
            y += textSize

        })
    }
}
/**
 * The stack is used to determine menu hierarchy
 * @returns The array containing all the menus open
 */
export function getStack() {
    return stack
}
/**
 * Add a menu to the list for use
 * @param {string} name
 * @param {object} menu eg {onCreate(self){}, items:[{text:'item1',func(self){}}]}
 */
export function setMenu(name, menu) { menus[name] = menu }
/**
 * Set where to navigate to on startup
 * @param {string} value 
 */
export function setDefaultMenu(value) { defaultMenu = value }
/**
 * Set the color to be placed behind the menu
 * @param {string} value 
 */
export function setBackgroundColor(value) { backgroundColor = value }
/**
 * Set the color for when when an item can not be spelled with the input
 * @param {string} value 
 */
export function setInvalidColor(value) { invalidColor = value }
/**
 * Set the color for when an item can be spelled with the input
 * @param {string} value 
 */
export function setNormalColor(value) { normalColor = value }
/**
 * Set the color for when an item is spelled by the input
 * @param {string} value 
 */
export function setCorrectColor(value) { correctColor = value }
/**
 * Set the color for the selected item
 * @param {string} value 
 */
export function setHighlightedColor(value) { highlightedColor = value }
/**
 * Sets the ctx for the menu to use
 * @param {ctx} value 
 */
export function setCtx(value) { ctx = value }
/**
 * The font to use for menu items
 * @param {string} value 
 */
export function setFont(value) { font = value }
/**
 * The color for item info
 * @param {string} value 
 */
export function setInfoColor(value) { infoColor = value }
/**
 * The color for titles
 * @param {string} value 
 */
export function setTitleColor(value) { titleColor = value }
/**
 * The color for the input
 * @param {string} value 
 */
export function setInputColor(value) { inputColor = value }
/**
 * The maximum height for the menu
 * @param {number} value 
 */
export function setMaxHeight(value) { maxHeight = value }
/**
 * The title centering
 * @param {boolean} value 
 */
export function setCenterTitle(value) { centerTitle = value }
/**
 * The size for the text
 * @param {number} value 
 */
export function setTextSize(value) { textSize = value }


document.addEventListener('keypress', async (event) => await handleKey(event.key, 'press', event))
document.addEventListener('keyup', async (event) => await handleKey(event.key, 'up', event))
document.addEventListener('keydown', async (event) => await handleKey(event.key, 'down', event))