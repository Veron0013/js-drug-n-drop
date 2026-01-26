const submitForm = document.querySelector("#textForm")

const inputTxt = document.querySelector("#textInput")

const lineArea = document.querySelector('#line')

const markCanvas = document.querySelector('#marquee')

const textSelected = document.querySelector('#selectedCount')

const body = document.querySelector('body')

let isClickMode = true

let mouseMode = "none"

let textItemData = []

let startX = -1, startY = -1;

let ghostPointer = undefined, dragId = undefined, vSpanDrag = undefined, sourcePlaceholder = null;

//////////////
const setCounterText = () => {
	textSelected.textContent = textItemData.filter((item) => {
		return item.isMarked
	}).length
}

const handleDragOneModeStart = (targetSpan, e, domElement) => {

	const isLineChar = targetSpan.classList.contains("mark-span") && !targetSpan.classList.contains("placeholder");
	const isFloating = targetSpan.classList.contains("floating-span");

	if (isLineChar) {
		sourcePlaceholder = document.createElement("span");
		sourcePlaceholder.classList.add("mark-span", "placeholder");
		sourcePlaceholder.dataset.placeholder = "true";
		targetSpan.replaceWith(sourcePlaceholder);
	} else {
		sourcePlaceholder = null; // <-- важливо
	}


	console.log("drag", domElement, targetSpan, e, targetSpan.id)
	dragId = targetSpan.id

	vSpanDrag = targetSpan

	targetSpan.classList.add("is-dragging")

	domElement.insertAdjacentHTML("beforeend", `<div class="drag-ghost">${targetSpan.textContent}</div>`)

	ghostPointer = document.querySelector('.drag-ghost')
	//ghostPointer.style.left = (e.clientX - e.offsetX) + "px"
	//ghostPointer.style.top = (e.clientY - e.offsetY) + "px"

	ghostPointer.style.left = e.clientX + "px"
	ghostPointer.style.top = e.clientY + "px"

	console.log("object", e.clientX, e)
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
			isMarked: item.classList.contains("is-selected")
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

	textSelected.textContent = 0

	setTextItemData()

	setCounterText()

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
		console.log("dragmode")
		const targetSpan = e.target.closest('span.mark-span')

		console.log("dragmode", targetSpan)

		if (targetSpan && targetSpan.classList.contains("is-selected")) {
			mouseMode = 'dragOne'
			handleDragOneModeStart(targetSpan, e, body)
		}

		const floatSpan = e.target.closest('.floating-span')

		console.log("dragmode", e.target)

		if (floatSpan && floatSpan.classList.contains("is-selected")) {
			mouseMode = 'dragOne'
			handleDragOneModeStart(floatSpan, e, body)
		}

		if (!targetSpan && !floatSpan) {
			mouseMode = 'none'
			return
		}
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

		if (mouseMode === 'selection') {
			if (!isClickMode) handleLineSelect(rect)
			else handleLineClick(e)
		}

		console.log("up", e.ctrlKey, textItemData)

		setCounterText()
	}

	if (mouseMode === "dragOne" && ghostPointer && vSpanDrag) {

		ghostPointer.remove()
		const targetSpan = vSpanDrag
		targetSpan.classList.remove("is-dragging")

		const isFloatingDrag = targetSpan.classList.contains("floating-span");
		const isLineDrag = targetSpan.classList.contains("mark-span") && !isFloatingDrag;

		const pointerDOM = document.elementFromPoint(e.clientX, e.clientY)

		const dropTarget = pointerDOM.closest('span.mark-span')

		if (dropTarget && dropTarget.dataset.placeholder === "true") {
			if (isFloatingDrag) {
				// floating -> line
				targetSpan.classList.remove("floating-span");
				targetSpan.style.position = "";
				targetSpan.style.left = "";
				targetSpan.style.top = "";
				targetSpan.classList.add("mark-span");
			}

			dropIntoPlaceholder(dropTarget, targetSpan);
		}

		else if (dropTarget) {
			if (isLineDrag) {
				// твій варіант: swap з закриттям дірки
				swapWithSourcePlaceholder(dropTarget, targetSpan);
			} else if (isFloatingDrag) {
				// floating dropped onto char inside line: swap без sourcePlaceholder
				// перед цим перетворюємо floating на mark-span
				targetSpan.classList.remove("floating-span");
				targetSpan.style.position = "";
				targetSpan.style.left = "";
				targetSpan.style.top = "";
				targetSpan.classList.add("mark-span");

				// звичайний swap (той, що ти вже робив через маркер)
				swapPlain(dropTarget, targetSpan);
			}
		}


		//else {
		//	//dropNodes(targetSpan)

		//	const placeholder = document.createElement("span");
		//	placeholder.classList.add("mark-span", "placeholder");
		//	placeholder.dataset.placeholder = "true";

		//	const spValue = { textContent: targetSpan.textContent, id: `d-${targetSpan.id}` };

		//	targetSpan.before(placeholder);
		//	targetSpan.remove();

		//	const floatedSpan = document.createElement("span");
		//	floatedSpan.classList.add("floating-span", "is-selected");
		//	floatedSpan.id = spValue.id;
		//	floatedSpan.textContent = spValue.textContent;

		//	floatedSpan.style.position = "fixed";
		//	floatedSpan.style.left = e.clientX + "px";
		//	floatedSpan.style.top = e.clientY + "px";

		//	document.body.append(floatedSpan);

		//	console.log("drop", e.clientX, floatedSpan)
		//}
	}

	mouseMode = 'none'
	vSpanDrag = undefined
	sourcePlaceholder = null;
}

const swapPlain = (a, b) => {
	if (!a || !b || a === b) return;
	const parent = a.parentNode;
	if (!parent || parent !== b.parentNode) return;

	const marker = document.createComment("m");
	a.before(marker);
	a.replaceWith(b);
	marker.replaceWith(a);
};

const swapWithSourcePlaceholder = (dropNode, dragNode) => {
	if (!sourcePlaceholder) return; // важливо

	const marker = document.createComment("m");
	dropNode.before(marker);
	sourcePlaceholder.replaceWith(dropNode);
	marker.replaceWith(dragNode);
};


const dropIntoPlaceholder = (placeholderNode, dragNode) => {
	placeholderNode.replaceWith(dragNode);
};

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

document.addEventListener("pointerdown", handleMouseDown);

document.addEventListener("pointermove", handleMouseMove);

document.addEventListener("pointerup", handleMouseUp);
