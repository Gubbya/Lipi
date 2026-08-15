# Lipi completion-pass review

## Product promise

Lipi helps a learner begin at the writing-system level, hear each unit, build
first words and phrases, complete short quizzes, and mix selected languages in
puzzles. The core experience works offline and saves progress locally.

## Included in this build

- Marathi or English interface guidance
- Multi-select language onboarding and editable course shelf
- 17 target-language courses
- US/UK English pronunciation selection
- English A–Z, 44 phonemes, and 148 sound/spelling teaching units
- 56 grouped Marathi foundational lessons with 689 learning units
- Complete starter Marathi varṇamālā, mātrās, 37 expanded bārākhaḍī rows,
  Devanagari numbers 0–20, first reading, and conversation
- 199 structured foundation lessons and 1,589 learning units across the other
  15 non-English courses
- Complete beginner Cyrillic, Arabic, Hiragana, Katakana, Hangul, Devanagari,
  Kannada, Gurmukhi, Gujarati, and Telugu script inventories
- Mandarin Pinyin initials/finals, five tones, and starter Hanzi
- High-value French, Spanish, Italian, and German phonics patterns
- 11 practical conversation phrases per non-English language
- 1,874 bundled offline recordings for multilingual lessons and practice
- Bundled offline English audio with resumable expressive-voice generation
- Picture vocabulary with reusable internet-sourced CC-BY visuals
- Simple first phrases with romanization and English meaning
- On-screen Look/Say/Trace plus printable PDF worksheets
- Per-lesson recognition quizzes
- Mixed-language picture puzzles
- SQLite lesson completion, repeat counts, mastery, attempts, and practice history
- SM-2-style spaced review scheduling
- Persistent learner voice recording with self-checks
- Optional Gemini audio-based pronunciation coaching
- Multiple learner profiles on one device
- Responsive online Gemini tutor with intent-aware bundled offline lessons,
  pronunciation playback, quick prompts, and per-language private chat history
- Manual MongoDB backup and restore from the Profile tab
- Protected native-speaker content-review studio
- Secure MongoDB/Gemini backend foundation

## Future curriculum depth

1. Linguistically review every English phoneme/grapheme group.
2. Native-speaker and primary-teacher review of the new Marathi foundation,
   followed by graded readers beyond the first sentence level.
3. Native-teacher review and correction pass for every new language pack.
4. Replace neural starter audio with studio teacher recordings where needed.
5. Add handwriting stroke animations and connected Arabic-form tracing.
6. Add graded readers, sentence construction, grammar, and conversation scenarios.
7. Map future content to CEFR or an appropriate school-grade framework.

## Review test

1. Clear browser/app storage and launch Lipi.
2. Choose Marathi or English guidance.
3. Select at least three target languages.
4. Choose US or UK English if English is selected.
5. Open every selected course from the Learn shelf.
6. Complete one English lesson and one non-English lesson.
7. Confirm both show Completed and remain repeatable.
8. Open Marathi and confirm the seven lesson sections, all 56 lessons, and the
   expanded बārाखडी rows appear.
9. Complete one Marathi bārākhaḍī lesson, repeat it, and confirm the quiz target
   advances on the repeat.
10. Open a worksheet and check all script symbols render correctly.
11. Play a picture word and a first phrase.
12. Complete the six-round mixed-language puzzle.
13. Complete a Practice review and record a pronunciation attempt.
14. Open Worksheets and print or save one lesson as PDF.
15. Ask the Tutor a question with the server disabled and verify offline fallback.
16. Create a second learner profile, switch profiles, and confirm separate progress.
17. Restart offline and confirm course selections and progress remain.

## Known limitations

- Marathi and the other courses are foundational literacy paths, not full school-
  grade or CEFR-equivalent mastery courses. Full mastery content is a multi-year
  publishing and native-teacher-review task.
- Device speech quality and voice availability vary by operating system.
- Expressive Gemini audio generation is rate-limited and uses a resume manifest.
- Cloud sync is deliberately manual and offline-first.
- Atlas connectivity currently reports a strict TLS handshake failure on this
  Windows/Node environment; certificate verification has not been weakened.
- Language content needs native-speaker review before public release.
