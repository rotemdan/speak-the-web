namespace SpeakTheWeb {
	export const guessWordEndOffset = function(sourceText: string, wordStartOffset: number): number {
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
	}
}