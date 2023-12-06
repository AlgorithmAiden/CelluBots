let ctx
let defaultMenu = 'home'
let backgroundColor = '#000'
let invalidColor = '#f00'
let normalColor = '#fff'
let correctColor = '#0f0'
let highlightedColor = '#fff6'
let menus = {}
let stack = []
let input = ''
let selected = ''
let font = 'Times New Roman'
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
export function open(name) {

    //add the new menu to the stack
    stack.push(name)

    //grab the new menu
    const newMenu = menus[name]

    //run the onCreate export function, if applicable
    if (newMenu.onCreate)
        newMenu.onCreate(newMenu)

    //reset input / selected
    input = ''
    selected = ''
}
/**
 * For use with auto key inputs
 * @param {string} key 
 * @param {string} mode 
 * @param {object} event 
 */
export function handleKey(key, mode, event) {

    //prevent tabbing
    if (key == 'Tab') event.preventDefault()

    //open the default menu if any arrow key is pressed and the menu is closed
    if (mode == 'up' && stack.length == 0 && ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(key)) {
        open(defaultMenu)
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

        //hold the menu
        const currentMenu = menus[stack[stack.length - 1]]

        //check for input
        if (input.length > 0) {

            //find and run the export function for input
            currentMenu.items.forEach(item => {
                if (item.text.toLocaleLowerCase() == input.toLocaleLowerCase())
                    item.func(currentMenu)
            })
        } else {

            //find and run the export function for selected
            currentMenu.items.forEach(item => {
                if (item.text == selected)
                    item.func(currentMenu)
            })
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

    //add the key to input
    else if (mode == 'press' && key && !['Enter'].includes(key)) {
        input += key
    }
}
export function render(textSize, maxHeight) {

    //only run the renders if open
    if (stack.length > 0) {

        //use gradients to keep the text in the box
        let regularGrad, correctGrad, invalidGrad
        if (input.length > 0) {

            //offset the lines if there is any chars typed
            regularGrad = ctx.createLinearGradient(0, textSize, 0, maxHeight)
            regularGrad.addColorStop(0, '#0000')
            regularGrad.addColorStop(.001, normalColor)
            regularGrad.addColorStop(.999, normalColor)
            regularGrad.addColorStop(1, '#0000')
            correctGrad = ctx.createLinearGradient(0, textSize, 0, maxHeight)
            correctGrad.addColorStop(0, '#0000')
            correctGrad.addColorStop(.001, correctColor)
            correctGrad.addColorStop(.999, correctColor)
            correctGrad.addColorStop(1, '#0000')
            invalidGrad = ctx.createLinearGradient(0, textSize, 0, maxHeight)
            invalidGrad.addColorStop(0, '#0000')
            invalidGrad.addColorStop(.001, invalidColor)
            invalidGrad.addColorStop(.999, invalidColor)
            invalidGrad.addColorStop(1, '#0000')
        } else {

            //otherwise only cut off the bottom
            regularGrad = ctx.createLinearGradient(0, 0, 0, maxHeight)
            regularGrad.addColorStop(.999, '#fff')
            regularGrad.addColorStop(1, '#0000')
            correctGrad = ctx.createLinearGradient(0, 0, 0, maxHeight)
            correctGrad.addColorStop(.999, '#0f0')
            correctGrad.addColorStop(1, '#0000')
            invalidGrad = ctx.createLinearGradient(0, 0, 0, maxHeight)
            invalidGrad.addColorStop(.999, '#f00')
            invalidGrad.addColorStop(1, '#0000')
        }

        //hold the menu
        const currentMenu = menus[stack[stack.length - 1]]

        //shrink the menu if it is larger than needed
        maxHeight = Math.min(
            maxHeight,
            currentMenu.items.length * textSize
        )

        //draw the background
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, maxHeight)

        //ensure the text baseline is correct
        ctx.textBaseline = 'top'

        //set the font
        ctx.font = `${textSize}px ${font}`

        //sort the items
        let invalidItems = []
        let correctItems = []
        currentMenu.items.forEach(item => {
            const lowerText = item.text.toLocaleLowerCase()
            if (lowerText.length < input.length || lowerText.slice(0, input.length) != input.toLocaleLowerCase())
                invalidItems.push(item.text)
            else
                correctItems.push(item.text)
        })

        //render the input
        ctx.fillStyle = '#0f0'
        ctx.fillText(input, 0, 0)

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
            [...correctItems, ...invalidItems].forEach((text, index) => {
                if (text == selected)
                    selectedIndex = index
            })



        // handle scrolling
        y = -Math.min(
            Math.max(
                selectedIndex * textSize - y - maxHeight / 2,
                -y
            ),
            Math.max(
                currentMenu.items.length * textSize - maxHeight,
                -y
            ),
        )

        //render the correct items
        correctItems.forEach(text => {

            //only run if it will be seen
            if (y >= -textSize && y <= maxHeight) {

                //highlight if needed
                if (text == selected) {
                    ctx.fillStyle = highlightedColor
                    ctx.fillRect(0, y, canvas.width, Math.min(maxHeight - y, textSize))
                }

                //break into the two parts
                let x = 0
                const first = text.slice(0, lowerInput.length)
                const second = text.slice(lowerInput.length)

                //render both parts
                ctx.fillStyle = correctGrad
                ctx.fillText(first, 0, y)
                ctx.fillStyle = regularGrad
                ctx.fillText(second, ctx.measureText(first).width, y)
            }
            y += textSize
        })

        //render all the invalid items
        ctx.fillStyle = invalidGrad
        invalidItems.forEach(text => {

            //only run if it will be seen
            if (y >= -textSize && y <= maxHeight) {

                //highlight if needed
                if (text == selected) {
                    ctx.fillStyle = highlightedColor
                    ctx.fillRect(0, y, canvas.width, Math.min(maxHeight - y, textSize))
                    ctx.fillStyle = invalidGrad
                }

                //render the text
                ctx.fillText(text, 0, y)
            }
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

document.addEventListener('keypress', event => handleKey(event.key, 'press', event))
document.addEventListener('keyup', event => handleKey(event.key, 'up', event))
document.addEventListener('keydown', event => handleKey(event.key, 'down', event))