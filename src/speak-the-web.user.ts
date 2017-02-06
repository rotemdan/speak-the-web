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

	const speakTextNodes = async (textNodes: Node[]) => {
		if (!textNodes)
			return;

		// Concatentate the text content of all given nodes to yield the spoken text
		const text = concatTextNodes(textNodes).replace(/[\r\n]/g, " ");

		if (text === "")
			return;

		const utterance = new SpeechSynthesisUtterance(text);

		if (runningInChrome) {
			//log(speechSynthesis.getVoices().map((voice) => voice.name));

			for (const voice of speechSynthesis.getVoices()) {
				//if (voice.name.indexOf("Google UK English Female") === 0) {
				if (voice.localService === true) {
					utterance.voice = voice;
				}
			}

		} else {
			for (const voice of speechSynthesis.getVoices()) {
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

			utterance.onerror = (event: Event & { error: any }) => {
				log("Utterance error:", event.error);
				reject(event.error);
			}

			utterance.onboundary = (event: UtteranceEvent) => {
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
				} else {
					//log(event);
				}
			}

			speechSynthesis.speak(utterance);
		});
	}

	let currentlySpokenElement: HTMLElement | undefined;

	window.addEventListener("mousedown", async (event) => {
		// Check the middle mouse button was clicked
		if (event.button !== 1)
			return;

		// Prevent all existing browser behaviors that are triggered by the middle mouse button
		event.preventDefault();
		event.stopPropagation();

		//log(window.getSelection());

		// Get current mouse position relative to the viewport
		const mouseX = event.clientX;
		const mouseY = event.clientY;

		// Get the currently hovered element
		const hoveredElement = <HTMLElement>document.elementFromPoint(mouseX, mouseY);

		// If the hovered element, or an ancestor of it, is an anchor element and control key isn't pressed
		// return
		if (!event.ctrlKey && $(hoveredElement).closest("a").length > 0)
			return

		// Find the closest ancestor element having a tag that is considered suitable for speaking
		const targetElement = $(hoveredElement)
			.closest("pre,code,li,td,th,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
			.get(0);

		// If no matching element was found, return
		if (targetElement == null) {
			speechSynthesis.cancel();
			return;
		}

		// Find the bounding rectangle of all inner text nodes, recurse with a special filter that prevent
		// iterating into containers
		const textNodeRecursionFilter = (node: Node) => {
			return !$(node).is("p,li,ol,ul,table,th,td,dl,dd,dt,div,li,h1,h2,h3,h4,h5,main,section,article,aside,footer,nav");
		}

		const matchingTextNodes = getInnerTextNodes(targetElement, textNodeRecursionFilter);
		const boundingRectOfMatchingTextNodes = getBoundingRectangleOfTextNodes(matchingTextNodes);
/*
		log("Target element:", targetElement);
		log("Matching text nodes:", matchingTextNodes);
		log("Cursor X:", mouseX, ", Cursor Y:", mouseY);
		log("Bounding rect of text nodes:", boundingRectOfMatchingTextNodes);
		log("");
*/
		// Check the cursor is positioned above actual text that would be read
		if (mouseX < boundingRectOfMatchingTextNodes.left ||
			mouseX > boundingRectOfMatchingTextNodes.right ||
			mouseY < boundingRectOfMatchingTextNodes.top ||
			mouseY > boundingRectOfMatchingTextNodes.bottom) {

			speechSynthesis.cancel();
			return;
		}

		// If the engine is currently speaking, stop it, add a delay to
		// work around a bug in chrome where speech wouldn't start if cancel() was called very recently
		//log(speechSynthesis);
		if (speechSynthesis.paused === true && currentlySpokenElement === targetElement) {
			speechSynthesis.resume();
			return;
		} else if (speechSynthesis.speaking === true) {
			if (targetElement === currentlySpokenElement) {
				speechSynthesis.pause();
				return;
			} else {
				speechSynthesis.cancel();

				if (runningInChrome)
					await delay(300);
			}
		}

		// Set the target element as the currently spoken element
		currentlySpokenElement = targetElement;

		// Speak the text nodes selected from that element
		await speakTextNodes(matchingTextNodes)

		if (currentlySpokenElement === targetElement)
			currentlySpokenElement = undefined;
	}, true);


	window.addEventListener("keydown", (e) => {
		if (e.keyCode === 27) {
			speechSynthesis.cancel();
		}
	}, true);

	window.addEventListener("beforeunload", (e) => {
		if (speechSynthesis.speaking && currentlySpokenElement)
			speechSynthesis.cancel();
	}, true);

	window.addEventListener("click", (event) => {
		if (event.button === 1 && event.ctrlKey) {
			event.preventDefault();
			event.stopPropagation();
		}
	}, true);
}
