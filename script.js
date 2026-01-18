const submitForm = document.querySelector("#textForm")

const inputTxt = document.querySelector("#textInput")

const lineArea = document.querySelector('#line')

const markCanvas = document.querySelector('#marquee')

let isCtrlPressed = false

let textItemData = {}

let newX = 0, newY = 0, startX = 0, startY = 0;

const setCoordanatesData = (el) => {

	if (!textItemData[el]) return

}

const getHtmlForText = (text) => {
	const splitted = text.split("")

	const htmlForText = splitted.map((el, ind) =>
		`<span class = "mark-span" id="sp-${ind}">${el.trim()}</span>`
	)

	//console.log(splitted, htmlForText)

	return htmlForText.join("")
}

const submitFn = (e) => {
	e.preventDefault();

	textItemData = {}

	const textValuesHtml = getHtmlForText(inputTxt.value.trim())
	lineArea.innerHTML = textValuesHtml

	highlightedItems = document.querySelectorAll('.mark-span')

	highlightedItems.forEach((item) => {
		const rect = item.getBoundingClientRect();
		textItemData[item.id] = {
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
			isSelected: false,
			isMarked: false
		}
	});

	submitForm.reset();
};

const handleLineClick = (e) => {

	if (!textItemData) return

	const itemValue = e.target.closest('span')

	if (!itemValue) return

	if (isCtrlPressed) {
		itemValue.classList.toggle("is-selected")
		textItemData[itemValue.id].isMarked = itemValue.classList.contains("is-selected")
	}

	console.log('click', textItemData[itemValue.id])
}

const handleKeyDown = (e) => {
	isCtrlPressed = e.key === 'Control' && e.type === "keydown"
	//console.log(isCtrlPressed)
}

const handleKeyUp = (e) => {
	isCtrlPressed = e.key === 'Control' && e.type === "keydown"
	//console.log(isCtrlPressed)
}

const handleMouseDown = (e) => {
	markCanvas.classList.add('is-drawing')
	markCanvas.style.top = `${e.layerY}px`
	markCanvas.style.left = `${e.layerX}px`
	console.log(e.layerX, "window.getBoundingClientRect()", markCanvas)
}

const handleMouseUp = (e) => {
	markCanvas.classList.remove('is-drawing')
}

const handleMouseMove = (e) => {
	//const moveTop = Math.abs(markCanvas.top - lastRect.startX)
	markCanvas.style.top = `${e.layerY}px`
	markCanvas.style.left = `${e.layerX}px`

}


document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)

submitForm.addEventListener("submit", submitFn);

////lineArea.addEventListener("click", handleLineClick)
//document.addEventListener("mousemove", e => { console.log("mousemove", e) })
//document.addEventListener("mouseup", e => {
//	markCanvas.classList.remove('is-drawing')
//	console.log("mouseup", e)
//})

//lineArea.addEventListener("mousedown", handleMouseDown)
////document.addEventListener("dragstart", e => { console.log("dragstart", e) });

lineArea.addEventListener("pointerdown", handleMouseDown);

document.addEventListener("pointermove", (e) => {
	if (!e.buttons) return; // рух без натиснутої кнопки ігноруємо
	console.log("pointermove", e);
});

document.addEventListener("pointerup", handleMouseUp);

