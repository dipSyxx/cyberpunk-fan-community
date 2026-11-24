# Cyberpunk 2077 Fan Community

A responsive, mobile-first fan community built from the project’s Figma research and UX direction. In “Your Night City,” fans can choose allies, save districts, and join discussions with an account that works across devices.

## Design

- [Figma assignment](https://www.figma.com/design/slXSaiblxbcMCKsL8uxPji/Cyberpunk-2077-Fan-Community-%E2%80%94-2INF-Figma-Assignment?node-id=0-1)
- Visual system: dark surfaces, Cyberpunk yellow, cyan accents, Rajdhani display type, and Inter body type
- The implementation follows four mobile frames (`1:169`, `1:193`, `1:218`, `1:247`), four desktop frames (`2:117`, `2:160`, `2:197`, `7:47`), and the mobile menu overlay (`14:72`).

## Tech

- React 19
- TypeScript
- Vite
- React Router
- CSS with custom properties, Flexbox, Grid, and media queries
- Node.js TypeScript API, MariaDB 10.11, and Better Auth sessions
- Versioned SQL migrations and reference data in `server/migrations/`

## Features

- Four main sections: My Night City, Characters, Night City, and Community
- A Home dashboard that names your chosen allies and saved districts, links to both collections, and tracks three profile missions
- Night City outings that prioritize your saved districts, resume after a reload, and keep dated notes in your account. Repeats unlock after all new outings are complete
- Day and night comparisons for notes from the same outing, including older notes once you label them
- Fan clues created from an outing entry. The shareable link includes the district, clue title and hint you enter
- Save incoming fan clues for later. After completing a clue, add the next stop and share the full district relay, up to four stops
- A private journal for each district. Export a single note as JSON and share the file yourself. The recipient previews it before importing it into their own journal
- Finding checks from district notes. Share where and when you saw something, then save other players’ observations and add them to your district journal
- District collections of two or three notes. Share a collection link, preview and save a received collection, and add its notes to your own district journal
- Character dilemmas with a saved response and shareable versions. Save your own response to open a shared argument, then reveal story spoilers if you choose
- Responsive desktop navigation and keyboard-accessible mobile menu
- Account registration, login, and logout from the desktop navigation and mobile menu
- Character reactions, favorites filtering, and a five-star collection rating
- District saving with a saved-only view, public discussions, likes, and replies
- Community spoiler protection, enabled by default. Mark posts with spoilers and reveal protected discussions individually
- Related discussions for selected allies and districts, plus a My activity list for your posts and discussions you replied to
- Clear action feedback, active navigation states, and account data that persists across refreshes
- Semantic page structure, descriptive image text, visible focus states, and reduced-motion support

## Run locally

Use Node.js 22.18+ and MariaDB 10.11. Copy `.env.example` to `.env` and supply the server-only configuration. See the [database and Ubuntu runbook](docs/database-deployment.md) for initialization and grants.

```bash
npm ci
npm run db:init
npm run db:migrate
npm run db:status
npm run start:api
```

In a second terminal:

```bash
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

The runbook describes running `npm run test:integration` against an isolated MariaDB instance.

## Deployment

- Existing site: [cyberpunk-fan-community.vercel.app](https://cyberpunk-fan-community.vercel.app)
- The frontend uses same-origin `/api` requests. Configure and verify a trusted HTTPS route to the API before publishing this build. The [deployment runbook](docs/database-deployment.md#https-and-vercel) describes Apache and Vercel routing.

## Project structure

```text
src/
├── assets/images/
├── components/
├── data/
├── hooks/
├── pages/
├── styles/
├── App.tsx
└── main.tsx
```

`server/` contains the API, authentication, SQL migrations, and integration tests. `shared/` defines API response types.

## Image credits

Images are downloaded from the official sources linked in the Figma research board:

- [CD PROJEKT RED press center](https://press.cdprojektred.com/)
- [Cyberpunk 2077 official site](https://www.cyberpunk.net/)

This is an unofficial, non-commercial school project. Cyberpunk 2077 and its characters belong to CD PROJEKT RED.

## Scope

Guests can explore the catalogue, read Community, and preview eligible shared links. An account is required for writes and private journals. Sign-in uses username and password. The server validates sessions and owns authorization for each account’s data.

Players exchange individual district notes as JSON files. New share links open explicitly shared clues, collections, checks, observations, or argument versions. Older links and note files can still be previewed and imported. Existing local account passwords are replaced by new registration. In the browser and at the site address where you saved the old activity, sign in and use **Preview browser data** on Home. Publishing legacy posts and replies requires its own confirmation. The source browser data stays available.
