# Interface languages

Polish is the default. The PL / EN links select a language using `?lang=pl` or `?lang=en` and preserve the current tab hash. The choice is saved as `inppl.language` on the device.

Edit `en.tsv` (Polish phrase, tab, English phrase), then run `python locales/build.py` to regenerate `en.js`. Long phrases take precedence over short labels. Include dynamic sentence fragments where numbers interrupt a sentence.

`i18n.js` translates UI text and accessible labels, including newly rendered content and canvas labels. Form values remain unchanged. Mark content with `data-no-translate` to preserve literal text. Known player names are preserved. Number formatting uses `INPPL_I18N.locale`.

Checks: `node tests/i18n.cjs` verifies language switching, storage, hash links, mobile views and option values. `node tests/i18n-audit.cjs` writes a text inventory across pages, tabs and research dialogs to `outputs/i18n-english.json` for review. Both require Playwright and Edge.
