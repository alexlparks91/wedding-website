# Wedding world

Interactive 3D neighborhood (Astro + React Three Fiber), inspired by [tomjohn.design](https://www.tomjohn.design/).

The first place is **Home** — a stylized 1553 N Bell Ave Unit 2F (Wicker Park / Bucktown).

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Local server at `localhost:4321`            |
| `npm run build`   | Production build to `./dist/`               |
| `npm run preview` | Preview the production build                |

Prefer `astro dev --background` when an agent starts the server (see `AGENTS.md`).

## Controls

- Drag to orbit
- Scroll to zoom
- Click **Home** for place details
- Camera is saved in the URL (`?camera=...&at=home`)
