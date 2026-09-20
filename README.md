# Repo Radar

Search GitHub repositories, track your favorites, and see their stars, open issues and last commit.

**Live demo:** _add your Vercel URL here_
**Stack:** React 19, TypeScript, Redux Toolkit (+ RTK Query), MUI, MUI X Charts, Vite, Vitest

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

Requires Node 20.19+. Optional: put a throwaway GitHub token (no permissions) in `.env.local` as `VITE_GITHUB_TOKEN` to raise the API limit from 60 to 5,000 requests per hour. Deploys to Vercel with no extra config.

## How it works

- **Search:** uses RTK Query. It waits 400 ms after you stop typing, remembers past results, and cancels old requests when you type something new.
- **Tracked repos:** stored in one Redux slice. Each repo keeps its own loading state, error and last known numbers, so one repo failing never affects the others. If a refresh fails, the old numbers stay on screen with a Retry button.
- **Refreshing:** a repo can't be refreshed twice at once. "Refresh all" runs 4 requests at a time so GitHub doesn't block us.
- **Saving:** tracked repos are saved in `localStorage`, so they are still there after a reload. Loading and error states are not saved.
- **API calls:** all requests go through one small client that turns problems (rate limit, not found, no internet) into clear messages.
- **UI:** the chart loads only when you open the Tracked tab. Light and dark themes are included.

## Limitations

- Each refresh makes 2 API calls per repo (repo info and latest commit), so refreshing many repos without a token can hit the rate limit. The error shows on the affected repo, with Retry.
- No auto-refresh, no search pagination, and no sync between browser tabs.
- A token in frontend code is visible to anyone, so a real product would use a backend proxy.

## Next steps

- Use ETags so unchanged repos don't count against the rate limit
- Auto-refresh in the background, and a "load more" button for search
- Charts for open issues and star history
- Split the UI and chart code into separate packages, and add Storybook