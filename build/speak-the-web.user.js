// ==UserScript==
// @name        Speak the Web
// @namespace   AAA
// @description Speak any text on the page.
// @include     http://*
// @include     https://*
// @version     0.1.0
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript== 
var SpeakTheWeb;
(function (SpeakTheWeb) {
    SpeakTheWeb.log = console.log;
    SpeakTheWeb.isElementCompletelyVisible = (element) => {
        const elementClientRect = element.getBoundingClientRect();
        return (elementClientRect.top >= 0 &&
            elementClientRect.left >= 0 &&
            elementClientRect.bottom <= window.innerHeight &&
            elementClientRect.right <= window.innerWidth);
    };
    SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent = (element) => {
        const targetTextContent = $(element).text();
        const matchingChildren = $(element).children().filter((index, child) => $(child).text() === targetTextContent);
        if (matchingChildren.length > 0) {
            return SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent(matchingChildren.get(0));
        }
        else {
            return element;
        }
    };
    SpeakTheWeb.getInnerTextNodes = (element) => {
        let result = [];
        const allChildNodes = $(element).contents();
        for (let i = 0; i < allChildNodes.length; i++) {
            const node = allChildNodes.get(i);
            if (node.nodeType === Node.TEXT_NODE) {
                result.push(node);
            }
            else {
                result = result.concat(SpeakTheWeb.getInnerTextNodes(node));
            }
        }
        return result;
    };
    SpeakTheWeb.getBoundingRectangleOfTextNodeRange = (node, startOffset, endOffset) => {
        if (node.nodeType !== Node.TEXT_NODE)
            throw new TypeError("Node must be a text node");
        const range = document.createRange();
        range.setStart(node, startOffset || 0);
        range.setEnd(node, endOffset || node.textContent.length);
        return range.getBoundingClientRect();
    };
    SpeakTheWeb.getBoundingRectangleOfInnerTextNodes = (element) => {
        const allTextNodes = SpeakTheWeb.getInnerTextNodes(element);
        const clientRects = [];
        const clientRectUnion = {
            top: Infinity,
            left: Infinity,
            bottom: 0,
            right: 0
        };
        allTextNodes.forEach((node) => {
            const nodeRect = SpeakTheWeb.getBoundingRectangleOfTextNodeRange(node);
            if (nodeRect.width === 0 || nodeRect.height === 0)
                return;
            clientRects.push(nodeRect);
            clientRectUnion.top = Math.min(clientRectUnion.top, nodeRect.top);
            clientRectUnion.left = Math.min(clientRectUnion.left, nodeRect.left);
            clientRectUnion.bottom = Math.max(clientRectUnion.bottom, nodeRect.bottom);
            clientRectUnion.right = Math.max(clientRectUnion.right, nodeRect.right);
        });
        //log("Client rects:", clientRects);
        return clientRectUnion;
    };
})(SpeakTheWeb || (SpeakTheWeb = {}));
var SpeakTheWeb;
(function (SpeakTheWeb) {
    SpeakTheWeb.guessWordEndOffset = function (sourceText, wordStartOffset) {
        const wordAndRemainingText = sourceText.substring(wordStartOffset);
        if (/^e\.g\./.test(wordAndRemainingText))
            return wordStartOffset + 4;
        // Some symbols are pronounced as individual words:
        if (/^[\.\+\%\=\*\:\/©™&@]/.test(wordAndRemainingText))
            return wordStartOffset + 1;
        // Try to match up to the next punctuation character that is very likely to be a word
        // Boundary. The MS engines treat parts of abberviations like M.A. as separate words
        // so this would work with them as well.
        const wordEndMatch = /--|[\s—"“”@&`\^\.\,\;\:\(\)\[\]\{\}\<\>\=\?\!\$\*\%\/\\]|$/.exec(wordAndRemainingText);
        if (wordEndMatch == null) {
            return wordStartOffset;
        }
        let wordEndIndex = wordEndMatch.index;
        const matchedWord = wordAndRemainingText.substring(0, wordEndIndex);
        // If the last letter was an apostrophe (') character, and the character before the word start
        // wasn't an apostrophe and the previous to last character wasn't an "s", 
        // consider that apostrophe not to be a part of the word.
        if (/[\'\’]$]/.test(matchedWord) &&
            !/^[\'\’]$]/.test(sourceText[wordStartOffset - 1]) &&
            matchedWord[matchedWord.length - 2] !== "s") {
            wordEndIndex -= 1;
        }
        return wordStartOffset + wordEndIndex;
    };
})(SpeakTheWeb || (SpeakTheWeb = {}));
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var SpeakTheWeb;
(function (SpeakTheWeb) {
    //let timeSpeechHasLastEnded = 0;
    let timeWindowWasLastScrolled = 0;
    let timeCursorHasLastMoved = Infinity;
    let timeKeyWasLassedPressed = 0;
    let cursorX = 0;
    let cursorY = 0;
    $(window).on("scroll", () => {
        timeWindowWasLastScrolled = Date.now();
        timeCursorHasLastMoved = Infinity;
    });
    $(window).on("mousemove", (e) => {
        timeCursorHasLastMoved = Date.now();
        cursorX = e.clientX;
        cursorY = e.clientY;
    });
    $(window).on("mouseleave blur", function (e) {
        if (e.target !== this)
            return;
        //speechSynthesis.cancel();
    });
    $(window).on("focus", function (e) {
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
        }
        else if (e.keyCode === 27) {
            speechSynthesis.cancel();
        }
        else {
            timeKeyWasLassedPressed = Date.now();
            timeCursorHasLastMoved = Infinity;
        }
    });
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
				font-size: 14px;
			}

			#speakTheWebHighlightingRectangle {
				position: absolute; 
				display: inline; 
				z-index:99999;
				//background-color: rgb(254, 242, 192);
				background-color: #ffcd00;
				opacity: 0;
			}
	</style>`);
    const playIcon = $("<span id='speakTheWebPlayIcon'>&#x25B6;</span>");
    $("body").append(playIcon);
    const playIconWidth = playIcon.width();
    const playIconHeight = playIcon.height();
    const highlightingRectangle = $("<span id='speakTheWebHighlightingRectangle' />");
    $("body").append(highlightingRectangle);
    //highlightingRectangle.offset({ top: 0, left: 0 });	
    let currentTargetElement;
    const speakTargetElement = () => __awaiter(this, void 0, void 0, function* () {
        if (!currentTargetElement)
            return;
        const textNodes = SpeakTheWeb.getInnerTextNodes(currentTargetElement);
        let text = "";
        textNodes.forEach((node) => {
            text += node.textContent;
        });
        SpeakTheWeb.log(textNodes);
        text = text.replace(/[\r\n]/g, " ");
        SpeakTheWeb.log("Target element:", currentTargetElement);
        SpeakTheWeb.log("Text:", text);
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (/Chrome/.test(navigator.userAgent)) {
            for (let voice of speechSynthesis.getVoices()) {
                if (voice.localService === true) {
                    utterance.voice = voice;
                }
            }
        }
        else {
            for (let voice of speechSynthesis.getVoices()) {
                if (voice.name.indexOf("Microsoft Zira Desktop") === 0) {
                    utterance.voice = voice;
                }
            }
        }
        return new Promise((resolve, reject) => {
            utterance.onend = (event) => {
                highlightingRectangle.css("opacity", "0");
                resolve();
            };
            utterance.onerror = (event) => {
                SpeakTheWeb.log("Utterance error:", event.error);
                reject(event.error);
            };
            utterance.onboundary = (event) => {
                if (event.name === "word") {
                    const wordStartOffset = event.charIndex;
                    const wordEndOffset = SpeakTheWeb.guessWordEndOffset(text, wordStartOffset);
                    const word = text.substring(wordStartOffset, wordEndOffset);
                    SpeakTheWeb.log(word);
                    let nodeTextStartOffset = 0;
                    for (let node of textNodes) {
                        const nodeText = node.textContent;
                        //const nodeTextEndOffset = nodeTextStartOffset + nodeText.length;
                        if (nodeTextStartOffset + nodeText.length > wordStartOffset) {
                            //log(node);
                            const nodeWordStartOffset = wordStartOffset - nodeTextStartOffset;
                            const nodeWordEndOffset = Math.min(nodeWordStartOffset + word.length, nodeText.length);
                            const wordRect = SpeakTheWeb.getBoundingRectangleOfTextNodeRange(node, nodeWordStartOffset, nodeWordEndOffset);
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
            };
            speechSynthesis.speak(utterance);
        });
    });
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
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
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
        const hoveredElement = document.elementFromPoint(cursorX, cursorY);
        const boundingElement = $(hoveredElement)
            .closest("pre,code,li,td,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
            .get(0);
        const targetElement = SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent(boundingElement);
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
        const boundingRectOfInnerTextNodes = SpeakTheWeb.getBoundingRectangleOfInnerTextNodes(targetElement);
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
        //if (targetElement !== boundingElement)
        //	log("Using deeper desendant with same text content:", hoveredElement, boundingElement, targetElement);
        const onTargetElementMouseLeave = () => {
            $(targetElement).off("mouseleave", onTargetElementMouseLeave);
            setTimeout(() => {
                if (currentTargetElement === targetElement)
                    playIcon.css("opacity", "0");
            }, 2000);
        };
        $(targetElement).on("mouseleave", onTargetElementMouseLeave);
        //if (playIcon.css("display") === "none") {
        playIcon.css("opacity", "0.3");
        //const targetElementOffset = $(targetElement).offset();
        //log(boundingRectOfInnerTextNodes);
        playIcon.offset({
            //top: $(window).scrollTop() + boundingRectOfInnerTextNodes.top - playIconHeight / 2, 
            //left: $(window).scrollLeft() + boundingRectOfInnerTextNodes.right + playIconWidth / 2 
            top: $(window).scrollTop() +
                (boundingRectOfInnerTextNodes.top +
                    boundingRectOfInnerTextNodes.bottom) / 2 -
                playIconHeight / 2,
            left: $(window).scrollLeft() + boundingRectOfInnerTextNodes.left - playIconWidth - 4
        });
        //log($(playIcon).offset());
        //}
        currentTargetElement = targetElement;
    }), 100);
})(SpeakTheWeb || (SpeakTheWeb = {}));
