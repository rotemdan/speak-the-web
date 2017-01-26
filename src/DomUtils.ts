namespace SpeakTheWeb {
	export const log = console.log;

	export const isElementCompletelyVisible = (element: HTMLElement) => {
		const elementClientRect = element.getBoundingClientRect();

		return (elementClientRect.top >= 0 &&
			elementClientRect.left >= 0 &&
			elementClientRect.bottom <= window.innerHeight &&
			elementClientRect.right <= window.innerWidth)
	}

	export const findDeepestDescendantWithIdenticalTextContent = (element: HTMLElement): HTMLElement => {
		const targetTextContent = $(element).text();
		const matchingChildren = $(element).children().filter((index, child) => $(child).text() === targetTextContent);

		if (matchingChildren.length > 0) {
			return findDeepestDescendantWithIdenticalTextContent(matchingChildren.get(0));
		} else {
			return element;
		}
	}

	export const getInnerTextNodes = (element: Element): Node[] => {
		let result: Node[] = [];
		const allChildNodes = $(element).contents();

		for (let i = 0; i < allChildNodes.length; i++) {
			const node = allChildNodes.get(i);

			if (node.nodeType === Node.TEXT_NODE) {
				result.push(node);
			} else {
				result = result.concat(getInnerTextNodes(node));
			}
		}

		return result;
	}

	class Rect {
		constructor(clientRect?: ClientRect) {
			if (clientRect) {
				this.top = clientRect.top;
				this.left = clientRect.left;
				this.bottom = clientRect.bottom;
				this.right = clientRect.right;
			}
		}

		top: number = 0;
		left: number = 0;
		bottom: number = 0;
		right: number = 0;

		get width() {
			return this.right - this.left;
		}

		get height() {
			return this.bottom - this.top;
		}
	};


	export const getBoundingRectangleOfTextNodeRange = (node: Node, startOffset?: number, endOffset?: number): Rect => {
		if (node.nodeType !== Node.TEXT_NODE)
			throw new TypeError("Node must be a text node");

		const range = document.createRange();
		range.setStart(node, startOffset || 0);
		range.setEnd(node, endOffset || node.textContent!.length);
		return new Rect(range.getBoundingClientRect());
	}

	export const getBoundingRectangleOfInnerTextNodes = (element: Element) => {
		const allTextNodes = getInnerTextNodes(element);

		const rects: Rect[] = [];
		const rectUnion = new Rect();
		rectUnion.top = Infinity,
		rectUnion.left = Infinity,

		allTextNodes.forEach((node) => {
			const nodeRect = getBoundingRectangleOfTextNodeRange(node);

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
	}
}