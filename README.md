# Cyberpunk 2077 Fan Community

A responsive, mobile-first fan community built from the project’s Figma research and UX direction. The product works as a browser-local “Your Night City” profile: choose an ally, save a district, and join a discussion.

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
- `localStorage` for browser-only persistence

## Features

- Four main sections: My Night City, Characters, Night City, and Community
- A Home dashboard that names your chosen allies and saved districts, links to both collections, and tracks three profile missions
- Night City outings that prioritize your saved districts, resume after a reload, and keep dated notes in a local journal. Repeats unlock after all new outings are complete
- Day and night comparisons for notes from the same outing, including older notes once you label them
- Fan clues created from an outing entry. The shareable link includes the district, clue title and hint you enter
- Save incoming fan clues for later. After completing a clue, add the next stop and share the full district relay, up to four stops
- A local journal for each district. Export a single note as JSON and share the file yourself. The recipient previews it before importing it into their own journal
- Finding checks from district notes. Share where and when you saw something, then save other players’ observations and add them to your district journal
- District collections of two or three notes. Share a collection link, preview and save a received collection, and add its notes to your own district journal
- Character dilemmas with a local response and shareable arguments. Save your own response to open a shared argument, then reveal story spoilers if you choose
- Responsive desktop navigation and keyboard-accessible mobile menu
- Browser-local account registration, login, and logout from the desktop navigation and mobile menu
- Character reactions, favorites filtering, and a local five-star rating
- District saving with a saved-only view, community likes, replies, and locally created discussions
- Community spoiler protection, enabled by default. Mark posts with spoilers and reveal protected discussions individually
- Related discussions for selected allies and districts, plus a My activity list that opens your local posts and discussions you replied to
- Clear action feedback, active navigation states, and browser-local persistence across refreshes
- Semantic page structure, descriptive image text, visible focus states, and reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Deployment

- Live site: [cyberpunk-fan-community.vercel.app](https://cyberpunk-fan-community.vercel.app)
- `vercel.json` rewrites client-side routes to `index.html`, so direct links and browser refreshes work on every page after deployment.

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

## Image credits

Images are downloaded from the official sources linked in the Figma research board:

- [CD PROJEKT RED press center](https://press.cdprojektred.com/)
- [Cyberpunk 2077 official site](https://www.cyberpunk.net/)

This is an unofficial, non-commercial school project. Cyberpunk 2077 and its characters belong to CD PROJEKT RED.

## Scope

The project runs without a backend, database, or admin panel. Local accounts use a username and password over HTTPS or localhost. The browser stores a salted password verifier and keeps the session across page reloads. Local accounts identify a session in the interface. Favorites, ratings, saved districts, community activity, and journals remain shared within the current browser profile. The pages are accessible as a guest.

Players exchange individual district notes as files and share clues, relays, finding checks, observations, collections, and dilemma arguments as links. Each link contains the shared content at the time it was created. Players open and save the links they receive to add the shared content to their browser.
