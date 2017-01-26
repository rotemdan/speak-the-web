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
    class Rect {
        constructor(clientRect) {
            this.top = 0;
            this.left = 0;
            this.bottom = 0;
            this.right = 0;
            if (clientRect) {
                this.top = clientRect.top;
                this.left = clientRect.left;
                this.bottom = clientRect.bottom;
                this.right = clientRect.right;
            }
        }
        get width() {
            return this.right - this.left;
        }
        get height() {
            return this.bottom - this.top;
        }
    }
    ;
    SpeakTheWeb.getBoundingRectangleOfTextNodeRange = (node, startOffset, endOffset) => {
        if (node.nodeType !== Node.TEXT_NODE)
            throw new TypeError("Node must be a text node");
        const range = document.createRange();
        range.setStart(node, startOffset || 0);
        range.setEnd(node, endOffset || node.textContent.length);
        return new Rect(range.getBoundingClientRect());
    };
    SpeakTheWeb.getBoundingRectangleOfInnerTextNodes = (element) => {
        const allTextNodes = SpeakTheWeb.getInnerTextNodes(element);
        const rects = [];
        const rectUnion = new Rect();
        rectUnion.top = Infinity,
            rectUnion.left = Infinity,
            allTextNodes.forEach((node) => {
                const nodeRect = SpeakTheWeb.getBoundingRectangleOfTextNodeRange(node);
                if (nodeRect.width === 0 || nodeRect.height === 0)
                    return;
                rects.push(nodeRect);
                rectUnion.top = Math.min(rectUnion.top, nodeRect.top);
                rectUnion.left = Math.min(rectUnion.left, nodeRect.left);
                rectUnion.bottom = Math.max(rectUnion.bottom, nodeRect.bottom);
                rectUnion.right = Math.max(rectUnion.right, nodeRect.right);
            });
        //log("Client rects:", clientRects);
        return rectUnion;
    };
})(SpeakTheWeb || (SpeakTheWeb = {}));
var SpeakTheWeb;
(function (SpeakTheWeb) {
    SpeakTheWeb.guessWordEndOffset = function (sourceText, wordStartOffset) {
        const wordAndRemainingText = sourceText.substring(wordStartOffset);
        // Handle some common abberviations
        const first4Letters = wordAndRemainingText.substring(0, 4).toLowerCase();
        if (first4Letters === "e.g." || first4Letters === "i.e.")
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
    $(document).on("keypress", (e) => {
        if (e.ctrlKey === true && e.which === "`".charCodeAt(0)) {
            if (GM_getValue("scriptEnabled") !== "false") {
                GM_setValue("scriptEnabled", "false");
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
    });
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
    const speakElement = (element) => __awaiter(this, void 0, void 0, function* () {
        if (!element)
            return;
        const textNodes = SpeakTheWeb.getInnerTextNodes(element);
        let text = "";
        textNodes.forEach((node) => {
            text += node.textContent;
        });
        SpeakTheWeb.log(textNodes);
        text = text.replace(/[\r\n]/g, " ");
        SpeakTheWeb.log("Target element:", element);
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
                    //log(word);
                    let nodeTextStartOffset = 0;
                    for (let node of textNodes) {
                        const nodeText = node.textContent;
                        if (nodeTextStartOffset + nodeText.length > wordStartOffset) {
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
    let currentlySpokenElement;
    $(window).on("click", (event) => {
        if (GM_getValue("scriptEnabled") === "false") {
            return;
        }
        if (event.button === 1 && event.ctrlKey) {
            const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
            if ($(hoveredElement).closest("a").length > 0) {
                event.preventDefault();
                return false;
            }
        }
        return true;
    });
    $(window).on("mousedown", (event) => __awaiter(this, void 0, void 0, function* () {
        if (GM_getValue("scriptEnabled") === "false") {
            return;
        }
        if (event.button !== 1)
            return;
        const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
        if ($(hoveredElement).closest("a").length > 0) {
            if (!event.ctrlKey)
                return;
            event.preventDefault();
        }
        const boundingElement = $(hoveredElement)
            .closest("pre,code,li,td,th,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
            .get(0);
        const targetElement = SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent(boundingElement);
        // Make sure the element is not a container of some sort
        if ($("li,ol,ul,table,th,td,dl,dd,dt,div,li,h1,h2,h3,h4,h5,main,section,article,aside,footer,nav", targetElement).length > 0)
            return;
        if (targetElement == null) {
            return;
        }
        const boundingRectOfInnerTextNodes = SpeakTheWeb.getBoundingRectangleOfInnerTextNodes(targetElement);
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
        if (targetElement === currentlySpokenElement) {
            speechSynthesis.cancel();
            return;
        }
        currentlySpokenElement = targetElement;
        yield speakElement(targetElement);
        if (currentlySpokenElement === targetElement)
            currentlySpokenElement = undefined;
    }));
})(SpeakTheWeb || (SpeakTheWeb = {}));
