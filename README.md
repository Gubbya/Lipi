# Lipi

**Language, made familiar.**

Lipi is a mobile-first, offline-first multilingual learning app built with Expo
SDK 57, React Native, TypeScript, Expo Router, and SQLite.

## Current courses

English (US/UK), Marathi, Hindi, French, Spanish, Italian, German, Russian,
Arabic, Mandarin Chinese, Japanese, Korean, Kannada, Punjabi, Gujarati, Telugu,
and Sanskrit.

English contains a validated 44-phoneme reference and exactly 148 teachable
letter/sound/spelling units across 23 lessons. Marathi contains 56 grouped
foundational lessons and 689 learning units covering the complete starter
varṇamālā, vowel signs, 37 expanded bārākhaḍī rows, Devanagari numbers 0–20,
reading, and conversation. Each remaining course contains six structured
foundation lessons covering script, numbers, picture vocabulary, phrases,
worksheets, quizzes, and repeatable progress.

The application also includes multiple learner profiles, spaced repetition,
voice recording, optional AI pronunciation coaching, an online/offline tutor,
printable PDF worksheets, manual cloud backup/restore, and a protected content
review studio.

## Run the app

```powershell
npm install
npx expo start --clear
```

Press `w` for web. Use a compatible Expo Go version or development build for a
physical Android device.

## Verification

```powershell
npx tsc --noEmit
npm run lint
npm run server:check
npm run validate:migrations
npx expo-doctor
npx expo export --platform web
```

## Backend

Copy `server/.env.example` to `server/.env`, then configure MongoDB and Gemini.
The real `.env` is ignored by Git.

```powershell
npm run server
```

The backend refuses to start unless `MONGODB_DB=lipi`. Without a configured
`AI_API_TOKEN`, it binds to localhost and rejects non-local API requests.

Endpoints:

- `GET /health`
- `GET /api/progress/:deviceUserId`
- `PUT /api/progress/:deviceUserId`
- `POST /api/tutor`
- `POST /api/pronunciation`
- `GET /api/content-review/:languageId`
- `PUT /api/content-review/:languageId`

SQLite remains the primary offline store. MongoDB is for optional backup and
manual multi-device synchronization. Add the server URL and `AI_API_TOKEN` in
the app under **Profile → Cloud & AI**. Raw voice recordings are never uploaded
by progress backup.

## Content and visual licensing

Course content is bundled and validated locally. Vocabulary pictograms are
Twemoji graphics licensed under CC-BY 4.0; attribution is stored in
`assets/images/vocabulary/ATTRIBUTION.md`.

The Marathi writing-system inventory follows the current Unicode Devanagari
repertoire. Every lesson can be heard with the device's Marathi voice, completed
as a recognition quiz, printed as a worksheet, repeated, and scheduled for
spaced review.

## Important scope note

English is commonly analyzed as roughly 44 phonemes represented by many
spellings, rather than 148 distinct sounds. Lipi therefore provides 44 phoneme
records and 148 teaching units, keeping sounds and spellings separate.

All course material must receive native-speaker and teacher review before a
public educational release. The built-in Content Review Studio tracks that
approval without allowing unvalidated runtime curriculum changes.
