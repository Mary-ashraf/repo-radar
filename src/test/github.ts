import { vi } from "vitest";
import type { GhRepo } from "../api/types";

export const ghRepo = (id: number, over: Partial<GhRepo> = {}): GhRepo => ({
  id,
  name: `repo${id}`,
  full_name: `octo/repo${id}`,
  html_url: `https://github.com/octo/repo${id}`,
  description: `Repo number ${id}`,
  language: "TypeScript",
  stargazers_count: id * 100,
  open_issues_count: id,
  owner: { login: "octo", avatar_url: "https://example.com/a.png" },
  ...over,
});

export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" }, ...init });

export const COMMIT_DATE = "2026-09-01T12:00:00Z";
const commits = [{ commit: { committer: { date: COMMIT_DATE }, author: { date: COMMIT_DATE } } }];

type Handler = (url: URL) => Response | undefined | Promise<Response | undefined>;

/**
 * Stubs global fetch with a tiny fake GitHub. `override` can answer first;
 * anything it returns undefined for falls through to happy-path defaults.
 */
export function mockGithub(override: Handler = () => undefined) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const custom = await override(url);
    if (custom) return custom;

    const repoById = url.pathname.match(/^\/repositories\/(\d+)$/);
    if (repoById) return json(ghRepo(Number(repoById[1])));
    if (url.pathname.endsWith("/commits")) return json(commits);
    if (url.pathname === "/search/repositories") {
      return json({ total_count: 2, items: [ghRepo(1), ghRepo(2)] });
    }
    return json({ message: "Not Found" }, { status: 404 });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
