# Lipi

**Language, made familiar.**

Lipi is a mobile-first, offline-first multilingual learning app built with Expo
SDK 57, React Native, TypeScript, Expo Router, and SQLite.

## Current courses

English (US/UK), Marathi, Hindi, French, Spanish, Italian, German, Russian,
Arabic, Mandarin Chinese, Japanese, Korean, Kannada, Punjabi, Gujarati, Telugu,
and Sanskrit.

English currently has the deepest phonics path. Every other course includes a
reviewable starter package with script lessons, pronunciation, picture
vocabulary, first phrases, worksheets, quizzes, and repeatable progress.

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

SQLite remains the primary offline store. MongoDB is for optional backup and
future multi-device synchronization.

## Content and visual licensing

Course content is bundled and validated locally. Vocabulary pictograms are
Twemoji graphics licensed under CC-BY 4.0; attribution is stored in
`assets/images/vocabulary/ATTRIBUTION.md`.

## Important scope note

English is commonly analyzed as roughly 44 phonemes represented by about
140–150 spelling patterns, rather than 148 distinct sounds. Lipi models sounds
and spellings separately so the curriculum can grow accurately.
