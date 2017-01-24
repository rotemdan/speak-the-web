const log = console.log;

const isElementCompletelyVisible = (element: HTMLElement) => {
	const elementClientRect = element.getBoundingClientRect();

	return (elementClientRect.top >= 0 &&
		elementClientRect.left >= 0 &&
		elementClientRect.bottom <= window.innerHeight &&
		elementClientRect.right <= window.innerWidth)
}

const findDeepestDescendantWithIdenticalTextContent = (element: HTMLElement): HTMLElement => {
	const targetTextContent = $(element).text();
	const matchingChildren = $(element).children().filter((index, child) => $(child).text() === targetTextContent);

	if (matchingChildren.length > 0) {
		return findDeepestDescendantWithIdenticalTextContent(matchingChildren.get(0));
	} else {
		return element;
	}
}

const getInnerTextNodes = (element: Element): Node[] => {
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

type Rect = { top: number, left: number, bottom: number, right: number };

const getBoundingRectangleOfInnerTextNodes = (element: Element) => {
	const allTextNodes = getInnerTextNodes(element);

	const clientRects: Rect[] = [];
	const clientRectUnion: Rect = {
		top: Infinity,
		left: Infinity,
		bottom: 0,
		right: 0
	};

	allTextNodes.forEach((node) => {
		const range = document.createRange();
		range.selectNode(node);
		const nodeRect = range.getBoundingClientRect()
		clientRects.push(nodeRect);

		clientRectUnion.top = Math.min(clientRectUnion.top, nodeRect.top);
		clientRectUnion.left = Math.min(clientRectUnion.left, nodeRect.left);
		clientRectUnion.bottom = Math.max(clientRectUnion.bottom, nodeRect.bottom);
		clientRectUnion.right = Math.max(clientRectUnion.right, nodeRect.right);
	});

	//log("Client rects:", clientRects);

	return clientRectUnion;
}