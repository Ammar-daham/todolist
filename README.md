# Todo App

A single-page todo app built with Vue 3 and Vite, styled with Bootstrap 5. All data is stored locally in the browser (`localStorage`) — there's no backend.

## Features

- **Lists** — organize tasks into separate named lists; switch, rename, or delete a list from the title dropdown. Every other view (Tasks, Removed, History) is scoped to whichever list is active
- **Tasks** — add, edit (double-click the text or use the pencil icon), toggle done, and delete
- **Priority levels** — High / Medium / Low, shown as a colored badge and filterable
- **Due dates** — optional per task, with color-coded overdue/upcoming indicators
- **Search** — filter tasks by keyword, combined with the status and priority filters
- **One filter bar** — a single toolbar holds search, an All / Active / Completed segment, and multi-select priority chips. Selecting no chips means every priority, so there is no separate "All" chip; a **Clear** button appears only while something is filtered
- **Views** — Tasks, Removed, and History live in the toolbar's ⋯ menu, since they switch collection rather than filter one
- **Soft delete** — deleting a task moves it to the **Removed** view instead of erasing it, with restore and a confirm-before-permanent-delete step
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
  composables/       useTodos (task state/persistence), useLists (lists), useTheme (dark mode)
  constants/         Priority definitions
  utils/             Relative-time formatting and history grouping helpers
  style.css          Global styles and light/dark CSS variables
```

State lives in `useTodos` (src/composables/useTodos.js) and `useLists` (src/composables/useLists.js), both persisted to `localStorage` on every change. Each task carries a `listId`; `useTodos` takes the active list's id and scopes all of its views to it.

## Tech stack

- [Vue 3](https://vuejs.org/) 
- [Vite](https://vitejs.dev/)
- [Bootstrap 5](https://getbootstrap.com/) + [Bootstrap Icons](https://icons.getbootstrap.com/)
