namespace SpeakTheWeb {
	export const delay = async (time: number) => {
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
}