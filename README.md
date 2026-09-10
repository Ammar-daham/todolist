# Todo App

A single-page todo app built with Vue 3 and Vite, styled with Bootstrap 5. All data is stored locally in the browser (`localStorage`) — there's no backend.

## Features

- **Tasks** — add, edit (double-click the text or use the pencil icon), toggle done, and delete
- **Priority levels** — High / Medium / Low, shown as a colored badge and filterable
- **Due dates** — optional per task, with color-coded overdue/upcoming indicators
- **Search** — filter tasks by keyword, combined with the priority filter
- **Soft delete** — deleting a task moves it to a **Removed** tab instead of erasing it, with restore and a confirm-before-permanent-delete step
- **History** — an activity log of every created/completed/removed event, grouped by day, week, month, or year
- **Dark mode** — toggle with the preference remembered across visits
- **Timestamps** — created/completed/removed times shown as relative time ("2m ago")

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Project structure

```
src/
  components/       Vue SFCs (TodoApp is the top-level orchestrator)
  composables/       useTodos (task state/persistence), useTheme (dark mode)
  constants/         Priority definitions
  utils/             Relative-time formatting and history grouping helpers
  style.css          Global styles and light/dark CSS variables
```

State lives in `useTodos` (src/composables/useTodos.js) and is persisted to `localStorage` on every change.

## Tech stack

- [Vue 3](https://vuejs.org/) 
- [Vite](https://vitejs.dev/)
- [Bootstrap 5](https://getbootstrap.com/) + [Bootstrap Icons](https://icons.getbootstrap.com/)
