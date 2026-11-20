# Task Manager

A responsive task manager with add/edit/delete, labels, priorities, filtering, search, and local backup/restore — built with vanilla HTML, CSS, and JavaScript.

## Features

- Add, edit, and delete tasks
- Undo after deleting tasks
- Name, date/time, label, and priority per task
- Mark tasks complete
- Overdue state for missed deadlines, kept separate from completed tasks
- Filter by All / Active / Overdue / Completed
- Real-time search
- Optional smart search by meaning in English and Arabic that runs on the device (Transformers.js), with no task data leaving the browser
- A reminder per task (none, at the deadline, 5 min to 1 day before, or a custom time), a default reminder for new tasks, and a bell on each card
- Dark / light / system theme in purple and yellow, with a softly moving background
- Export a readable .txt report
- Backup and restore tasks as JSON
- Data persists locally via localStorage
- Tasks grouped into Overdue / Today / Upcoming / Completed, sorted by deadline or priority
- Relative due times like "in 2 h" or "overdue by 1 day", refreshed every 30 seconds
- Daily progress line ("4 of 9 done today") with a progress bar
- Filter by label (custom labels included) and priority, combined with status and search
- Installable as an app (PWA) and works offline
- Keyboard shortcuts: N for a new task, Enter to save, Esc to close
- Quick deadline entry: DD/MM/YYYY date with a calendar, 12-hour time with AM/PM, Today / Tomorrow / Next week and time buttons, with a preview and a warning for past times
- English and Arabic with a one-click switch: full right-to-left layout, Arabic dates and plurals, and a local Arabic font that works offline
- Built-in guide: a welcome tour that points out every feature on the real page (with optional sample tasks), plus How to use and Help and tips in the menu
- Optional AI features (off until turned on in the menu), using Claude through a small Cloudflare Worker:
  - Quick add in plain English or Arabic (Saudi dialect included), typed or spoken, that fills the add form for review
  - Label and priority suggestions while typing a new task's name, used only with one tap
  - Plan my day: an order for today's and overdue tasks with a short reason for each

## AI Worker

`worker/` holds the Cloudflare Worker behind the AI features. It has three fixed endpoints (`/parse`, `/suggest`, `/plan`) with their instructions on the server, answers only the GitHub Pages origin, limits input sizes, and has a per-IP rate limit and a daily cap (see `wrangler.toml`). It uses Claude Haiku with structured JSON output and checks every answer. The API key is the `ANTHROPIC_API_KEY` secret, set in the Cloudflare dashboard and never stored in the repo. Deploy with `npm install` and `npx wrangler deploy` in `worker/`.

## Tech stack

HTML, CSS, JavaScript (no frameworks), Lucide icons, Inter and Cairo fonts (self-hosted)

## Live demo

https://ahmedalsoufi14-4r4s.github.io/TaskManager-app/
