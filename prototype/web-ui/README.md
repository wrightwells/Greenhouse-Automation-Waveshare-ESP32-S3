# Greenhouse Controller Local Web UI Prototype

This folder contains a desktop-browser prototype of the local web status, control, recovery, and configuration pages described in the functional specification.

## Purpose

This is a developer-machine UX prototype, not the final embedded implementation.

It helps validate:

- page layout and navigation
- status information hierarchy
- configuration grouping and validation
- manual override and maintenance flows
- recovery / AP setup flow
- OTA/admin interaction patterns

## Stack

- Vite
- React
- TypeScript
- local mock state with browser `localStorage`

## Run

```bash
cd prototype/web-ui
npm install
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Notes

- No backend is required.
- State is mocked and persisted only in the browser.
- Secrets shown here are placeholders and should never be copied into source control.
- The final embedded UI will need tighter resource usage, simpler rendering, and a real persistence layer appropriate for the ESP32 implementation.
