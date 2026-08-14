# Lipi multilingual MVP

## Product promise

Lipi helps a learner begin at the writing-system level, hear each unit, build
first words and phrases, complete short quizzes, and mix selected languages in
puzzles. The core experience works offline and saves progress locally.

## Included in this build

- Marathi or English interface guidance
- Multi-select language onboarding and editable course shelf
- 17 target-language courses
- US/UK English pronunciation selection
- English A–Z and foundational phonics-pattern path
- Starter script lessons for every non-English course
- Tap-to-hear device pronunciation for multilingual starter content
- Bundled offline English audio with resumable expressive-voice generation
- Picture vocabulary with reusable internet-sourced CC-BY visuals
- Simple first phrases with romanization and English meaning
- Look/Say/Trace worksheets
- Per-lesson recognition quizzes
- Mixed-language picture puzzles
- SQLite lesson completion, repeat counts, mastery, attempts, and practice history
- Secure MongoDB/Gemini backend foundation

## Course expansion order

1. Finish and linguistically review all English phoneme/grapheme groups.
2. Expand Marathi into full varṇamālā and bārākhaḍī.
3. Expand Hindi, Gujarati, Punjabi, Kannada, Telugu, and Sanskrit scripts.
4. Add complete Latin-alphabet pronunciation packs for French, Spanish,
   Italian, and German.
5. Expand Cyrillic and Arabic joining forms.
6. Expand Hiragana/Katakana, Hangul blocks, and Mandarin tones/Hanzi strokes.
7. Add graded readers, sentence construction, and conversation scenarios.

## Review test

1. Clear browser/app storage and launch Lipi.
2. Choose Marathi or English guidance.
3. Select at least three target languages.
4. Choose US or UK English if English is selected.
5. Open every selected course from the Learn shelf.
6. Complete one English lesson and one non-English lesson.
7. Confirm both show Completed and remain repeatable.
8. Open a worksheet and check all script symbols render correctly.
9. Play a picture word and a first phrase.
10. Complete the six-round mixed-language puzzle.
11. Restart offline and confirm course selections and progress remain.

## Known limitations

- Non-English courses are foundational starter packs, not yet complete CEFR or
  school-grade curricula.
- Device speech quality and voice availability vary by operating system.
- Expressive Gemini audio generation is rate-limited and uses a resume manifest.
- Cloud sync APIs exist, but the mobile client remains offline-first and does
  not upload automatically.
- Atlas connectivity currently reports a strict TLS handshake failure on this
  Windows/Node environment; certificate verification has not been weakened.
- Language content needs native-speaker review before public release.
