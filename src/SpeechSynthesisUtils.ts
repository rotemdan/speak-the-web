const speakText = async function (text: string): Promise<void> {
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
			resolve();
		}

		utterance.onerror = (event) => {
			log("Utterance error:", event.error);
			reject(event.error);
		}

		speechSynthesis.speak(utterance);
	});
}