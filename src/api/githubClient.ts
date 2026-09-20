import type {
  AppError,
  GhCommit,
  GhRepo,
  GhSearchResponse,
  RepoStats,
  RepoSummary,
} from "./types";

const API_BASE = "https://api.github.com";
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

export class GitHubApiError extends Error implements AppError {
  constructor(
    readonly kind: AppError["kind"],
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

const isAbortError = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

/** Normalizes anything thrown by the client into a serializable AppError. */
export function toAppError(e: unknown): AppError {
  if (e instanceof GitHubApiError) return { kind: e.kind, message: e.message, status: e.status };
  if (isAbortError(e)) return { kind: "aborted", message: "Request cancelled." };
  return { kind: "http", message: e instanceof Error ? e.message : "Something went wrong." };
}

export async function buildHttpError(res: Response): Promise<GitHubApiError> {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const isRateLimited =
    res.status === 429 || (res.status === 403 && (remaining === "0" || res.headers.has("retry-after")));

  if (isRateLimited) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    const when = reset
      ? ` Try again after ${new Date(reset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
      : " Try again in a minute.";
    return new GitHubApiError("rate_limit", `GitHub rate limit reached.${when}`, res.status);
  }
  if (res.status === 404) {
    return new GitHubApiError(
      "not_found",
      "Repository not found. It may have been deleted or made private.",
      404,
    );
  }
  let detail = "";
  try {
    detail = ((await res.json()) as { message?: string }).message ?? "";
  } catch {
    /* body wasn't JSON */
  }
  return new GitHubApiError("http", detail || `GitHub responded with ${res.status}.`, res.status);
}

async function request<T>(
  path: string,
  signal?: AbortSignal,
  tolerate: readonly number[] = [],
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      signal,
      headers: {
        Accept: "application/vnd.github+json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new GitHubApiError("network", "Couldn't reach GitHub. Check your connection and retry.");
  }
  if (res.ok) return (await res.json()) as T;
  if (tolerate.includes(res.status)) return null;
  throw await buildHttpError(res);
}

export const mapRepo = (r: GhRepo): RepoSummary => ({
  id: r.id,
  fullName: r.full_name,
  name: r.name,
  owner: r.owner.login,
  ownerAvatarUrl: r.owner.avatar_url,
  htmlUrl: r.html_url,
  description: r.description,
  language: r.language,
  stars: r.stargazers_count,
  openIssues: r.open_issues_count,
});

export async function searchRepositories(query: string, signal?: AbortSignal): Promise<RepoSummary[]> {
  const params = new URLSearchParams({ q: query, per_page: "20" });
  const data = await request<GhSearchResponse>(`/search/repositories?${params}`, signal);
  return (data?.items ?? []).map(mapRepo);
}

export interface RepoSnapshot {
  repo: RepoSummary;
  stats: RepoStats;
}

/**
 * Fetches current stats for a repo. Looked up by numeric id so renames and
 * transfers don't break tracking; the latest commit is then read via the
 * current full name.
 */
export async function fetchRepoSnapshot(id: number, signal?: AbortSignal): Promise<RepoSnapshot> {
  const raw = await request<GhRepo>(`/repositories/${id}`, signal);
  if (!raw) throw new GitHubApiError("http", "Empty response from GitHub.");
  const repo = mapRepo(raw);

  // 409 = repository is empty (no commits yet).
  const commits = await request<GhCommit[]>(`/repos/${repo.fullName}/commits?per_page=1`, signal, [409]);
  const latest = commits?.[0]?.commit;

  return {
    repo,
    stats: {
      stars: repo.stars,
      openIssues: repo.openIssues,
      lastCommitAt: latest?.committer?.date ?? latest?.author?.date ?? null,
      fetchedAt: Date.now(),
    },
  };
}
