declare function GM_getValue(key: string): string;
declare function GM_setValue(key: string, value: string): void;

namespace SpeakTheWeb {
	$("head").append(`
	<style>
			#speakTheWebHighlightingRectangle {
				position: absolute; 
				display: inline; 
				z-index:99999;
				background-color: #ffcd00;
				opacity: 0;
			}
	</style>`);

	const highlightingRectangle = $("<span id='speakTheWebHighlightingRectangle' />");
	$("body").append(highlightingRectangle);

	const speakElement = async (element: HTMLElement) => {
		if (!element)
			return;

		const textNodes = getInnerTextNodes(element);
		let text = "";

		textNodes.forEach((node) => {
			text += node.textContent;
		});

		log(textNodes);

		text = text.replace(/[\r\n]/g, " ");

		log("Target element:", element);
		log("Text:", text);

		const utterance = new SpeechSynthesisUtterance(text);

		if (/Chrome/.test(navigator.userAgent)) {
			for (let voice of speechSynthesis.getVoices()) {
				if (voice.localService === true) {
					utterance.voice = voice;
				}
			}
		} else {
			for (let voice of speechSynthesis.getVoices()) {
				if (voice.name.indexOf("Microsoft Zira Desktop") === 0) {
					utterance.voice = voice;
				}
			}
		}

		return new Promise<void>((resolve, reject) => {
			utterance.onend = (event) => {
				highlightingRectangle.css("opacity", "0");
				resolve();
			}

			utterance.onerror = (event) => {
				log("Utterance error:", event.error);
				reject(event.error);
			}

			utterance.onboundary = (event) => {
				if (event.name === "word") {
					const wordStartOffset = event.charIndex;
					const wordEndOffset = guessWordEndOffset(text, wordStartOffset);
					const word = text.substring(wordStartOffset, wordEndOffset);
					//log(word);

					let nodeTextStartOffset = 0;

					for (let node of textNodes) {
						const nodeText = node.textContent!;

						if (nodeTextStartOffset + nodeText.length > wordStartOffset) {
							const nodeWordStartOffset = wordStartOffset - nodeTextStartOffset;
							const nodeWordEndOffset = Math.min(nodeWordStartOffset + word.length, nodeText.length);
							const wordRect = getBoundingRectangleOfTextNodeRange(node, nodeWordStartOffset, nodeWordEndOffset);

							highlightingRectangle.width(wordRect.width);
							highlightingRectangle.height(wordRect.height);

							highlightingRectangle.offset({
								top: $(window).scrollTop() + wordRect.top,
								left: $(window).scrollLeft() + wordRect.left
							});

							highlightingRectangle.css("opacity", "0.15");

							break;
						}

						nodeTextStartOffset += nodeText.length;
					}
				}
			}

			speechSynthesis.speak(utterance);
		});
	}

	const delay = async (time: number) => {
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const interval = setInterval(() => {
				if (Date.now() - startTime > time) {
					clearInterval(interval);
					resolve();
				}
			}, 10);
		});
	}

	let currentlySpokenElement: HTMLElement | undefined;

	window.addEventListener("click", (event) => {
		if (GM_getValue("scriptEnabled") === "false") {
			return;
		}

		if (event.button === 1 && event.ctrlKey) {
			const hoveredElement = <HTMLElement>document.elementFromPoint(event.clientX, event.clientY);
			if ($(hoveredElement).closest("a").length > 0) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}, true);

	window.addEventListener("mousedown", async (event) => {
		if (event.button !== 1)
			return;

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();

		const hoveredElement = <HTMLElement>document.elementFromPoint(event.clientX, event.clientY);
		if ($(hoveredElement).closest("a").length > 0) {
			if (!event.ctrlKey)
				return;

			event.preventDefault();
		}

		const boundingElement = $(hoveredElement)
			.closest("pre,code,li,td,th,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
			.get(0);

		const targetElement = findDeepestDescendantWithIdenticalTextContent(boundingElement);

		// Make sure the element is not a container of some sort
		if ($("li,ol,ul,table,th,td,dl,dd,dt,div,li,h1,h2,h3,h4,h5,main,section,article,aside,footer,nav", targetElement).length > 0)
			return;

		if (targetElement == null) {
			return;
		}

		const boundingRectOfInnerTextNodes = getBoundingRectangleOfInnerTextNodes(targetElement);

		/*
			log("Contents:", $(targetElement).contents())
			log("All text nodes:", getInnerTextNodes(targetElement));
			log("Bounding rects:", targetElement.getBoundingClientRect(), getBoundingRectangleOfInnerTextNodes(targetElement));
			log("Cursor x:", cursorX, ", Cursor y:", cursorY);
		*/

		// Check the cursor is positioned above actual content and not just an empty spacing area
		if (event.clientX < boundingRectOfInnerTextNodes.left ||
			event.clientX > boundingRectOfInnerTextNodes.right ||
			event.clientY < boundingRectOfInnerTextNodes.top ||
			event.clientY > boundingRectOfInnerTextNodes.bottom) {
			return;
		}

		if (speechSynthesis.speaking === true) {
			if (targetElement === currentlySpokenElement) {
				speechSynthesis.cancel();
				return;
			} else {
				speechSynthesis.cancel();
				await delay(200);
			}
		}

		currentlySpokenElement = targetElement;
		await speakElement(targetElement)

		if (currentlySpokenElement === targetElement)
			currentlySpokenElement = undefined;
	}, true);


	window.addEventListener("keydown", (e) => {
		if (e.keyCode === 27) {
			speechSynthesis.cancel();
		}
	}, true);

	window.addEventListener("beforeunload", (e) => {
		speechSynthesis.cancel();
	}, true);	
}