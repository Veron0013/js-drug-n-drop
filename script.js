const submitForm = document.querySelector("#textForm")

const inputTxt = document.querySelector("#textInput")

const lineArea = document.querySelector('#line')

const markCanvas = document.querySelector('#marquee')

let isClickMode = true

let mouseMode = "none"

let textItemData = []

let startX = -1, startY = -1;

let ghostPointer = undefined, dragId = undefined

//////////////

const handleDragOneModeStart = (targetSpan, e) => {

	dragId = targetSpan.id

	targetSpan.classList.add("is-dragging")

	lineArea.insertAdjacentHTML("beforeend", `<div class="drag-ghost">${targetSpan.textContent}</div>`)

	ghostPointer = document.querySelector('.drag-ghost')
	ghostPointer.style.left = e.clientX + "px"
	ghostPointer.style.top = e.clientY + "px"
}

const setTextItemData = () => {
	textItemData = []

	const highlightedItems = document.querySelectorAll('.mark-span')

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
}

const getWidthHeightSelect = (xPos, yPos) => {
	const width = Math.abs(xPos - startX)
	const height = Math.abs(yPos - startY)

	return { width, height }
}

const getHtmlForText = (text) => {
	const splitted = text.split("")

	const htmlForText = splitted.map((el, ind) =>
		`<span class = "mark-span" id="sp-${ind}">${el}</span>`
	)

	//console.log(splitted, htmlForText)

	return htmlForText.join("")
}

const handleLineSelect = (rect) => {

	console.log("select", textItemData)
	if (!textItemData.length) return

	//const itemValue = e.target.closest('span')

	const itemList = textItemData.filter((item) => {
		return item.left < rect.right && item.right > rect.left && item.top < rect.bottom && item.bottom > rect.top
	})

	if (!itemList.length) return

	for (const element of itemList) {
		const spanElement = document.querySelector(`#${element.id}`)
		spanElement.classList.add("is-selected")
		element.isMarked = spanElement.classList.contains("is-selected")
	}
}

const handleLineClick = (e) => {

	console.log("click", textItemData)
	if (!textItemData.length) return

	const itemValue = e.target.closest('span')

	if (!itemValue) return

	const itemList = textItemData.filter((item) => {
		return item.id === itemValue.id
	})

	if (itemList.length !== 1) return

	itemValue.classList.toggle("is-selected")
	itemList[0].isMarked = itemValue.classList.contains("is-selected")

	console.log('click', itemList)
}

//listeners callbacks
const submitFn = (e) => {
	e.preventDefault();

	const textValuesHtml = getHtmlForText(inputTxt.value.trim())
	lineArea.innerHTML = textValuesHtml

	submitForm.reset();

}

const handleMouseDown = (e) => {
	if (e.ctrlKey) {
		mouseMode = 'selection'

		setTextItemData()

		isClickMode = true

		startX = e.clientX
		startY = e.clientY

		markCanvas.classList.add('is-drawing')
	} else {
		const targetSpan = e.target.closest('span.mark-span')

		if (!targetSpan || !targetSpan.classList.contains("is-selected")) {
			mouseMode = 'none'
			return
		}

		mouseMode = 'dragOne'

		handleDragOneModeStart(targetSpan, e)
	}
}

const handleMouseUp = (e) => {

	if (startX >= 0 && startY >= 0) {
		markCanvas.classList.remove('is-drawing')

		const rect = markCanvas.getBoundingClientRect();

		const { width, height } = getWidthHeightSelect(e.clientX, e.clientY)

		isClickMode = width <= 8 && height <= 8

		startX = -1
		startY = -1

		markCanvas.style.top = "0px"
		markCanvas.style.left = "0px"
		markCanvas.style.width = "0px"
		markCanvas.style.height = "0px"

		console.log("move", e.ctrlKey, textItemData)

		if (mouseMode === 'selection') {
			if (!isClickMode) handleLineSelect(rect)
			else handleLineClick(e)
		}

	}

	if (mouseMode === "dragOne" && ghostPointer) {
		console.log("dragOne")
		ghostPointer.remove()
		const targetSpan = document.querySelector(`#${dragId}`)
		targetSpan.classList.remove("is-dragging")
	}

	mouseMode = 'none'
}

const handleMouseMove = (e) => {

	if (mouseMode === "dragOne" && ghostPointer) {
		ghostPointer.style.left = e.clientX + "px"
		ghostPointer.style.top = e.clientY + "px"
	}

	if (startX < 0 && startY < 0) return

	const top = Math.min(e.clientY, startY)
	const left = Math.min(e.clientX, startX)

	const { width, height } = getWidthHeightSelect(e.clientX, e.clientY)

	markCanvas.style.top = `${top}px`
	markCanvas.style.left = `${left}px`
	markCanvas.style.width = `${width}px`
	markCanvas.style.height = `${height}px`
}

//listemers
submitForm.addEventListener("submit", submitFn);

lineArea.addEventListener("pointerdown", handleMouseDown);

document.addEventListener("pointermove", handleMouseMove);

document.addEventListener("pointerup", handleMouseUp);
