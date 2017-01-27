namespace SpeakTheWeb {
	export class Rect {
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
	}
}