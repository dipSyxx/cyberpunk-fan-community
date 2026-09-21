# Cyberpunk 2077 Fan Community

A responsive, mobile-first fan community built from the project’s Figma research and UX direction.

## Design

- [Figma assignment](https://www.figma.com/design/slXSaiblxbcMCKsL8uxPji/Cyberpunk-2077-Fan-Community-%E2%80%94-2INF-Figma-Assignment?node-id=0-1)
- Visual system: dark surfaces, Cyberpunk yellow, cyan accents, Rajdhani display type, and Inter body type
- The mobile implementation follows the four supplied Figma frames (`1:169`, `1:193`, `1:218`, `1:247`) and the menu overlay (`14:72`).

## Tech

- React 19
- TypeScript
- Vite
- React Router
- CSS with custom properties, Flexbox, Grid, and media queries
- `localStorage` for browser-only persistence

## Features

- Four routes: Home, Characters, Night City, and Community
- Responsive desktop navigation and keyboard-accessible mobile menu
- Character reactions, district saving, and community likes
- Locally created community discussions
- Active navigation states and persistent reactions across refreshes
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

The project intentionally has no backend, authentication, database, real-time comments, or admin panel. Static data is isolated under `src/data`, making a later API integration straightforward.
