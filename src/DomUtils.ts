namespace SpeakTheWeb {
	export const log = console.log;
	export const runningInChrome = /Chrome/.test(navigator.userAgent);

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

	export const getInnerTextNodes = (element: Node, recursionFilter?: (node: Node) => boolean): Node[] => {
		let result: Node[] = [];
		const allChildNodes = $(element).contents();

		for (let i = 0; i < allChildNodes.length; i++) {
			const node = <Node>allChildNodes.get(i);

			if (node.nodeType === Node.TEXT_NODE) {
				result.push(node);
			} else {
				if (recursionFilter && !recursionFilter(node))
					continue;

				result = result.concat(getInnerTextNodes(node, recursionFilter));
			}
		}

		return result;
	}

	export const getBoundingRectangleOfTextNodeRange = (node: Node, startOffset?: number, endOffset?: number): Rect => {
		if (node.nodeType !== Node.TEXT_NODE)
			throw new TypeError("Node must be a text node.");

		const range = document.createRange();
		range.setStart(node, startOffset || 0);
		range.setEnd(node, endOffset || node.textContent!.length);
		return new Rect(range.getBoundingClientRect());
	}

	export const getBoundingRectangleOfTextNodes = (textNodes: Node[]) => {
		const rectUnion = new Rect();
		rectUnion.top = Infinity,
			rectUnion.left = Infinity,

			textNodes.forEach((node) => {
				const nodeRect = getBoundingRectangleOfTextNodeRange(node);

				if (nodeRect.width === 0 || nodeRect.height === 0)
					return;

				rectUnion.top = Math.min(rectUnion.top, nodeRect.top);
				rectUnion.left = Math.min(rectUnion.left, nodeRect.left);
				rectUnion.bottom = Math.max(rectUnion.bottom, nodeRect.bottom);
				rectUnion.right = Math.max(rectUnion.right, nodeRect.right);
			});

		return rectUnion;
	}

	export const concatTextNodes = (textNodes: Node[]) => {
		return textNodes.reduce<string>(
					(content, node) => content.concat(node.textContent || ""), "")
	}
}