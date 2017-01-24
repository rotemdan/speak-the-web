declare function GM_getValue(key: string): string;
declare function GM_setValue(key: string, value: string): void;

$("body").append("<span id='speakTheWebPlayIcon'>&#x25B6;</span>");
const playIcon = $("#speakTheWebPlayIcon");
const playIconWidth = playIcon.width();
const playIconHeight = playIcon.height();

$("head").append(`
<style>
		.currentlySpokenElement { box-shadow: 0 0 0 2px #424242 !important; }
		#speakTheWebPlayIcon { 
			position: absolute; 
			display: inline; 
			visiblity: hidden; 
			opacity: 0; 
			transition: opacity 0.3s; 
			cursor: pointer; 
			z-index:99999; 
			//background-color: white; 
			color: black;
			font-family: Arial,Helvetica Neue,Helvetica,sans-serif; 
		}
</style>`);

let timeSpeechHasLastEnded = 0;
let timeWindowWasLastScrolled = 0;
let timeCursorHasLastMoved = Infinity;
let timeKeyWasLassedPressed = 0;

let cursorX = 0;
let cursorY = 0;

let currentTargetElement: HTMLElement | undefined;

$(window).on("scroll", () => {
	timeWindowWasLastScrolled = Date.now();
	timeCursorHasLastMoved = Infinity;
});

$(window).on("mousemove", (e) => {
	timeCursorHasLastMoved = Date.now();
	cursorX = e.clientX;
	cursorY = e.clientY;
});

$(window).on("mouseleave blur", function (this: any, e) {
	if (e.target !== this)
		return;

	//speechSynthesis.cancel();
});

$(window).on("focus", function (this: any, e) {
	if (e.target !== this)
		return;

	timeCursorHasLastMoved = Infinity;
});

$(document).on("keypress", (e) => {
	if (e.ctrlKey === true && e.which === "`".charCodeAt(0)) {
		if (GM_getValue("scriptEnabled") !== "false") {
			GM_setValue("scriptEnabled", "false");
			currentTargetElement = undefined;
			timeCursorHasLastMoved = Infinity;

			if (speechSynthesis.speaking)
				speechSynthesis.cancel();
		}
		else {
			GM_setValue("scriptEnabled", "true");
		}
	} else if (e.keyCode === 27) {
		speechSynthesis.cancel();
	} else {
		timeKeyWasLassedPressed = Date.now();
		timeCursorHasLastMoved = Infinity;
	}
});

const speakTargetElement = async () => {
	if (!currentTargetElement)
		return;

	const text = $(currentTargetElement).text().replace(/\r?\n/g, " ");

	if (text.length === 0)
		return;

	log("Target element:", currentTargetElement);
	log("Text:", text);

	//$("*").removeClass("currentlySpokenElement");
	//$(currentTargetElement).addClass("currentlySpokenElement");
	speechSynthesis.cancel();
	await speakText(text);
	//$(currentTargetElement).removeClass("currentlySpokenElement");

	timeSpeechHasLastEnded = Date.now();
}

playIcon.on("mousedown", () => {
	if (currentTargetElement)
		speakTargetElement();
});

playIcon.on("mouseenter", () => {
	playIcon.css("opacity", "1.0");
});

playIcon.on("mouseleave", () => {
	playIcon.css("opacity", "0.3");
});


setInterval(async () => {
	if (GM_getValue("scriptEnabled") === "false") {
		return;
	}
	/*
	if (document.hidden) {
		if (speechSynthesis.speaking) {
			speechSynthesis.cancel();
		}

		return;
	}
	*/
	const hoveredElement = <HTMLElement>document.elementFromPoint(cursorX, cursorY);
	const boundingElement = $(hoveredElement)
		.closest("pre,code,li,td,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
		.get(0);

	const targetElement = findDeepestDescendantWithIdenticalTextContent(boundingElement);

	/*
	if (targetElement == currentTargetElement) {
		if (currentTargetElementState === "speaking" ||
			currentTargetElementState === "finished") {
			return;
		}
	} else {
		if (currentTargetElementState === "speaking") {
			speechSynthesis.cancel();
		}

		currentTargetElement = targetElement;
		currentTargetElementState = "none";
	}
	*/

	if (targetElement == null)
		return;
	/*
	if (!isElementCompletelyVisible(targetElement))
		return;
	*/

	// Make sure this is not a container of some sort
	if ($("li,ol,ul,table,th,td,dl,dd,dt,div,li,h1,h2,h3,h4,h5,main,section,article,aside,footer,nav", targetElement).length > 0)
		return;

	const boundingRectOfInnerTextNodes = getBoundingRectangleOfInnerTextNodes(targetElement);

	/*
		log("Contents:", $(targetElement).contents())
		log("All text nodes:", getInnerTextNodes(targetElement));
		log("Bounding rects:", targetElement.getBoundingClientRect(), getBoundingRectangleOfInnerTextNodes(targetElement));
		log("Cursor x:", cursorX, ", Cursor y:", cursorY);
	*/

	// Check the cursor is positioned above actual content and not just an empty spacing area
	if (cursorX < boundingRectOfInnerTextNodes.left ||
		cursorX > boundingRectOfInnerTextNodes.right ||
		cursorY < boundingRectOfInnerTextNodes.top ||
		cursorY > boundingRectOfInnerTextNodes.bottom) {
		return;
	}
	//log($(targetElement).offset())
	
	/*
	if (timeSpeechHasLastEnded > Date.now() - 1000) {
		if (timeWindowWasLastScrolled > Date.now() - 1000 ||
			timeCursorHasLastMoved > Date.now() - 500) {
			return;
		}
	} else {
		if (timeWindowWasLastScrolled > Date.now() - 1500 ||
			timeCursorHasLastMoved > Date.now() - 1000) {
			return;
		}
	}
	*/

	if (targetElement !== boundingElement)
		log("Using deeper desendant with same text content:", hoveredElement, boundingElement, targetElement);

	const onTargetElementMouseLeave = () => {
		$(targetElement).off("mouseleave", onTargetElementMouseLeave);
		setTimeout(() => {
			if (currentTargetElement === targetElement)
				playIcon.css("opacity", "0");
		}, 2000);
	}

	$(targetElement).on("mouseleave", onTargetElementMouseLeave);

	//if (playIcon.css("display") === "none") {
		playIcon.css("opacity", "0.3");
		const targetElementOffset = $(targetElement).offset();
		playIcon.offset({ top: targetElementOffset.top - playIconHeight / 2, left: boundingRectOfInnerTextNodes.right });
		
		//log($(playIcon).offset());
	//}

	currentTargetElement = targetElement;
}, 100);
