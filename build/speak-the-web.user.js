// ==UserScript==
// @name        Speak the Web
// @namespace   https://github.com/rotemdan
// @description Speak any text on the page by middle-clicking it.
// @author      Rotem Dan <rotemdan@gmail.com>
// @include     http://*
// @include     https://*
// @version     0.1.4
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://code.jquery.com/jquery-3.1.1.min.js
// ==/UserScript== 
var SpeakTheWeb;
(function (SpeakTheWeb) {
    var Rect = (function () {
        function Rect(clientRect) {
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
        Object.defineProperty(Rect.prototype, "width", {
            get: function () {
                return this.right - this.left;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rect.prototype, "height", {
            get: function () {
                return this.bottom - this.top;
            },
            enumerable: true,
            configurable: true
        });
        return Rect;
    }());
    SpeakTheWeb.Rect = Rect;
})(SpeakTheWeb || (SpeakTheWeb = {}));
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var SpeakTheWeb;
(function (SpeakTheWeb) {
    var _this = this;
    SpeakTheWeb.delay = function (time) { return __awaiter(_this, void 0, void 0, function () {
        var startTime;
        return __generator(this, function (_a) {
            startTime = Date.now();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var interval = setInterval(function () {
                        if (Date.now() - startTime > time) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 10);
                })];
        });
    }); };
})(SpeakTheWeb || (SpeakTheWeb = {}));
var SpeakTheWeb;
(function (SpeakTheWeb) {
    SpeakTheWeb.log = console.log;
    SpeakTheWeb.runningInChrome = /Chrome/.test(navigator.userAgent);
    SpeakTheWeb.isElementCompletelyVisible = function (element) {
        var elementClientRect = element.getBoundingClientRect();
        return (elementClientRect.top >= 0 &&
            elementClientRect.left >= 0 &&
            elementClientRect.bottom <= window.innerHeight &&
            elementClientRect.right <= window.innerWidth);
    };
    SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent = function (element) {
        var targetTextContent = $(element).text();
        var matchingChildren = $(element).children().filter(function (index, child) { return $(child).text() === targetTextContent; });
        if (matchingChildren.length > 0) {
            return SpeakTheWeb.findDeepestDescendantWithIdenticalTextContent(matchingChildren.get(0));
        }
        else {
            return element;
        }
    };
    SpeakTheWeb.getInnerTextNodes = function (element, recursionFilter) {
        var result = [];
        var allChildNodes = $(element).contents();
        for (var i = 0; i < allChildNodes.length; i++) {
            var node = allChildNodes.get(i);
            if (node.nodeType === Node.TEXT_NODE) {
                result.push(node);
            }
            else {
                if (recursionFilter && !recursionFilter(node))
                    continue;
                result = result.concat(SpeakTheWeb.getInnerTextNodes(node, recursionFilter));
            }
        }
        return result;
    };
    SpeakTheWeb.getBoundingRectangleOfTextNodeRange = function (node, startOffset, endOffset) {
        if (node.nodeType !== Node.TEXT_NODE)
            throw new TypeError("Node must be a text node.");
        var range = document.createRange();
        range.setStart(node, startOffset || 0);
        range.setEnd(node, endOffset || node.textContent.length);
        return new SpeakTheWeb.Rect(range.getBoundingClientRect());
    };
    SpeakTheWeb.getBoundingRectangleOfTextNodes = function (textNodes) {
        var rectUnion = new SpeakTheWeb.Rect();
        rectUnion.top = Infinity,
            rectUnion.left = Infinity,
            textNodes.forEach(function (node) {
                var nodeRect = SpeakTheWeb.getBoundingRectangleOfTextNodeRange(node);
                if (nodeRect.width === 0 || nodeRect.height === 0)
                    return;
                rectUnion.top = Math.min(rectUnion.top, nodeRect.top);
                rectUnion.left = Math.min(rectUnion.left, nodeRect.left);
                rectUnion.bottom = Math.max(rectUnion.bottom, nodeRect.bottom);
                rectUnion.right = Math.max(rectUnion.right, nodeRect.right);
            });
        return rectUnion;
    };
    SpeakTheWeb.concatTextNodes = function (textNodes) {
        return textNodes.reduce(function (content, node) { return content.concat(node.textContent || ""); }, "");
    };
})(SpeakTheWeb || (SpeakTheWeb = {}));
var SpeakTheWeb;
(function (SpeakTheWeb) {
    SpeakTheWeb.guessWordEndOffset = function (sourceText, wordStartOffset) {
        var wordAndRemainingText = sourceText.substring(wordStartOffset);
        // Handle some common abberviations
        var first4Letters = wordAndRemainingText.substring(0, 4).toLowerCase();
        if (first4Letters === "e.g." || first4Letters === "i.e.")
            return wordStartOffset + 4;
        // Some symbols are pronounced as individual words:
        if (/^[\.\+\%\=\*\:\/©™&@]/.test(wordAndRemainingText))
            return wordStartOffset + 1;
        // Try to match up to the next punctuation character that is very likely to be a word
        // Boundary. The MS engines treat parts of abberviations like M.A. as separate words
        // so this would work with them as well.
        var wordEndMatch = /--|[\s—"“”@&`\^\.\,\;\:\(\)\[\]\{\}\<\>\=\?\!\$\*\%\/\\]|$/.exec(wordAndRemainingText);
        if (wordEndMatch == null) {
            return wordStartOffset;
        }
        var wordEndIndex = wordEndMatch.index;
        var matchedWord = wordAndRemainingText.substring(0, wordEndIndex);
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
var SpeakTheWeb;
(function (SpeakTheWeb) {
    var _this = this;
    $("head").append("\n\t<style>\n\t\t\t#speakTheWebHighlightingRectangle {\n\t\t\t\tposition: absolute; \n\t\t\t\tdisplay: inline; \n\t\t\t\tz-index:99999;\n\t\t\t\tbackground-color: #ffcd00;\n\t\t\t\topacity: 0;\n\t\t\t}\n\t</style>");
    var highlightingRectangle = $("<span id='speakTheWebHighlightingRectangle' />");
    $("body").append(highlightingRectangle);
    var speakTextNodes = function (textNodes) { return __awaiter(_this, void 0, void 0, function () {
        var text, utterance, _i, _a, voice, _b, _c, voice;
        return __generator(this, function (_d) {
            if (!textNodes)
                return [2 /*return*/];
            text = SpeakTheWeb.concatTextNodes(textNodes).replace(/[\r\n]/g, " ");
            if (text === "")
                return [2 /*return*/];
            utterance = new SpeechSynthesisUtterance(text);
            if (SpeakTheWeb.runningInChrome) {
                for (_i = 0, _a = speechSynthesis.getVoices(); _i < _a.length; _i++) {
                    voice = _a[_i];
                    if (voice.localService === true) {
                        utterance.voice = voice;
                    }
                }
            }
            else {
                for (_b = 0, _c = speechSynthesis.getVoices(); _b < _c.length; _b++) {
                    voice = _c[_b];
                    if (voice.name.indexOf("Microsoft Zira Desktop") === 0) {
                        utterance.voice = voice;
                    }
                }
            }
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    utterance.onend = function (event) {
                        highlightingRectangle.css("opacity", "0");
                        resolve();
                    };
                    utterance.onerror = function (event) {
                        SpeakTheWeb.log("Utterance error:", event.error);
                        reject(event.error);
                    };
                    utterance.onboundary = function (event) {
                        if (event.name === "word") {
                            var wordStartOffset = event.charIndex;
                            var wordEndOffset = SpeakTheWeb.guessWordEndOffset(text, wordStartOffset);
                            var word = text.substring(wordStartOffset, wordEndOffset);
                            //log(word);
                            var nodeTextStartOffset = 0;
                            for (var _i = 0, textNodes_1 = textNodes; _i < textNodes_1.length; _i++) {
                                var node = textNodes_1[_i];
                                var nodeText = node.textContent;
                                if (nodeTextStartOffset + nodeText.length > wordStartOffset) {
                                    var nodeWordStartOffset = wordStartOffset - nodeTextStartOffset;
                                    var nodeWordEndOffset = Math.min(nodeWordStartOffset + word.length, nodeText.length);
                                    var wordRect = SpeakTheWeb.getBoundingRectangleOfTextNodeRange(node, nodeWordStartOffset, nodeWordEndOffset);
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
                })];
        });
    }); };
    var currentlySpokenElement;
    window.addEventListener("mousedown", function (event) { return __awaiter(_this, void 0, void 0, function () {
        var mouseX, mouseY, hoveredElement, targetElement, textNodeRecursionFilter, matchingTextNodes, boundingRectOfMatchingTextNodes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Check the middle mouse button was clicked
                    if (event.button !== 1)
                        return [2 /*return*/];
                    // Prevent all existing browser behaviors that are triggered by the middle mouse button
                    event.preventDefault();
                    event.stopPropagation();
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                    hoveredElement = document.elementFromPoint(mouseX, mouseY);
                    // If the hovered element, or an ancestor of it, is an anchor element and control key isn't pressed
                    // return
                    if (!event.ctrlKey && $(hoveredElement).closest("a").length > 0)
                        return [2 /*return*/];
                    targetElement = $(hoveredElement)
                        .closest("pre,code,li,td,th,dd,dt,p,div,h1,h2,h3,h4,h5,a,section,article,aside,footer,header,button,caption")
                        .get(0);
                    // If no matching element was found, return
                    if (targetElement == null)
                        return [2 /*return*/];
                    textNodeRecursionFilter = function (node) {
                        return !$(node).is("p,li,ol,ul,table,th,td,dl,dd,dt,div,li,h1,h2,h3,h4,h5,main,section,article,aside,footer,nav");
                    };
                    matchingTextNodes = SpeakTheWeb.getInnerTextNodes(targetElement, textNodeRecursionFilter);
                    boundingRectOfMatchingTextNodes = SpeakTheWeb.getBoundingRectangleOfTextNodes(matchingTextNodes);
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
                        return [2 /*return*/];
                    }
                    if (!(speechSynthesis.speaking === true)) return [3 /*break*/, 3];
                    if (!(targetElement === currentlySpokenElement)) return [3 /*break*/, 1];
                    speechSynthesis.cancel();
                    return [2 /*return*/];
                case 1:
                    speechSynthesis.cancel();
                    if (!SpeakTheWeb.runningInChrome) return [3 /*break*/, 3];
                    return [4 /*yield*/, SpeakTheWeb.delay(250)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    // Set the target element as the currently spoken element
                    currentlySpokenElement = targetElement;
                    // Speak the text nodes selected from that element
                    return [4 /*yield*/, speakTextNodes(matchingTextNodes)];
                case 4:
                    // Speak the text nodes selected from that element
                    _a.sent();
                    if (currentlySpokenElement === targetElement)
                        currentlySpokenElement = undefined;
                    return [2 /*return*/];
            }
        });
    }); }, true);
    window.addEventListener("keydown", function (e) {
        if (e.keyCode === 27) {
            speechSynthesis.cancel();
        }
    }, true);
    window.addEventListener("beforeunload", function (e) {
        speechSynthesis.cancel();
    }, true);
    window.addEventListener("click", function (event) {
        if (event.button === 1 && event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
})(SpeakTheWeb || (SpeakTheWeb = {}));
