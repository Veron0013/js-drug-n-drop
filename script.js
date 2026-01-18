const submitForm = document.querySelector("#textForm")

const inputTxt = document.querySelector("#textInput")

const lineArea = document.querySelector('#line')

const markCanvas = document.querySelector('#marquee')

let isCtrlPressed = false

let textItemData = []

let newX = 0, newY = 0, startX = -1, startY = -1;

const getHtmlForText = (text) => {
	const splitted = text.split("")

	const htmlForText = splitted.map((el, ind) =>
		`<span class = "mark-span" id="sp-${ind}">${el}</span>`
	)

	//console.log(splitted, htmlForText)

	return htmlForText.join("")
}

const submitFn = (e) => {
	e.preventDefault();

	textItemData = []

	const textValuesHtml = getHtmlForText(inputTxt.value.trim())
	lineArea.innerHTML = textValuesHtml

	submitForm.reset();

	highlightedItems = document.querySelectorAll('.mark-span')

	highlightedItems.forEach((item) => {
		const rect = item.getBoundingClientRect();

		textItemData.push({
			id: item.id,
			top: rect.top,
			left: rect.left,
			right: rect.right,
			bottom: rect.bottom,
			isSelected: false,
			isMarked: false
		});

	})

};

const handleLineClick = (rect) => {

	console.log("click", textItemData)
	if (!textItemData.length) return

	//const itemValue = e.target.closest('span')

	//if (!itemValue) {
	itemList = textItemData.filter((item) => {
		return item.left < rect.right && item.right > rect.left && item.top < rect.bottom && item.bottom > rect.top
	})
	//}
	console.log("click", itemList, rect)
	if (!itemList.length) return

	for (const element of itemList) {
		spanElement = document.querySelector(`#${element.id}`)
		spanElement.classList.toggle("is-selected")
		element.isMarked = spanElement.classList.contains("is-selected")
	}
	console.log('click', itemList, rect)
}

const handleMouseDown = (e) => {
	markCanvas.classList.add('is-drawing')
	startX = e.clientX
	startY = e.clientY
}

const handleMouseUp = (e) => {
	markCanvas.classList.remove('is-drawing')

	const rect = markCanvas.getBoundingClientRect();

	startX = -1
	startY = -1

	markCanvas.style.top = "0px"
	markCanvas.style.left = "0px"
	markCanvas.style.width = "0px"
	markCanvas.style.height = "0px"

	console.log("move", e.ctrlKey, textItemData)
	if (e.ctrlKey) handleLineClick(rect)

}

const handleMouseMove = (e) => {
	if (startX < 0 && startY < 0) return

	const top = Math.min(e.clientY, startY)
	const left = Math.min(e.clientX, startX)

	const width = Math.abs(e.clientX - startX)
	const height = Math.abs(e.clientY - startY)

	markCanvas.style.top = `${top}px`
	markCanvas.style.left = `${left}px`
	markCanvas.style.width = `${width}px`
	markCanvas.style.height = `${height}px`
}


submitForm.addEventListener("submit", submitFn);

lineArea.addEventListener("pointerdown", handleMouseDown);

document.addEventListener("pointermove", handleMouseMove);

document.addEventListener("pointerup", handleMouseUp);

