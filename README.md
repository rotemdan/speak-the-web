# Speak the Web

A GreaseMonkey/TamperMonkey browser extension that allows any text to be spoken. Uses the cross-browser [SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

## How to install

The extension isn't ready for end-users yet, but you can test the latest development build:

1. Make sure you have latest [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (Firefox) or [TamperMonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) (Chrome) extension installed.
2. Open [this link](https://rawgit.com/rotemdan/speak-the-web/master/build/speak-the-web.user.js) and an installation message should appear.

## How to use

Clicking the the middle mouse button on any area of the page containing text would cause it to be spoken. A special exception is a link, which can be spoken using the `ctrl` + middle mouse button combination.

## Future

Once this gets usable enough it would be published as an independent extension for Chrome and Firefox, Opera and possibly Edge (by then it would have probably been moved over to use the [WebExtensions API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions)).