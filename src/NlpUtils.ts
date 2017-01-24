namespace SpeakTheWeb {
	export const guessWordEndOffset = function(sourceText: string, wordStartOffset: number): number {
		const wordAndRemainingText = sourceText.substring(wordStartOffset);

		// If the word starts with a dot, it is extremely likely that it have been
		// treated as a single word
		//if (wordAndRemainingText[0] === ".")
		//	return wordStartOffset + 1;

		// Try to match up to the next punctuation character that is very likely to be a word
		// Boundary. The MS engines treat parts of abberviations like M.A. as separate words
		// so this would work with them as well.
		const wordEndMatch = /--|[\s\.\,\;\"\:\(\)\[\]\{\}\=\—]|$/.exec(wordAndRemainingText);

		if (wordEndMatch == null) {
			return wordStartOffset;
		}

		let wordEndIndex = wordEndMatch.index;

		// If the word started with a punctuation character or a symbol, assume that character is the whole world.
		// Common ones: . = 
		if (wordEndIndex === 0)
			return wordStartOffset + 1;

		const matchedWord = wordAndRemainingText.substring(0, wordEndIndex);
		
		// If the last letter was single colon (') character, but the previous one
		// wasn't an "s", consider that colon not to be a part of the word.
		if (matchedWord.endsWith("'") && matchedWord[matchedWord.length - 2] !== "s")
			wordEndIndex -= 1;
		
		return wordStartOffset + wordEndIndex;
	}
}