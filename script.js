const submitForm = document.querySelector("#textForm")

const inputTxt = document.querySelector("#textInput")

const lineArea = document.querySelector('#line')

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


document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)

submitForm.addEventListener("submit", submitFn);

lineArea.addEventListener("click", handleLineClick)

