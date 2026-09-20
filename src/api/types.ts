/** Domain types. The rest of the app never touches raw GitHub payloads. */

export interface RepoSummary {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  openIssues: number;
}

export interface RepoStats {
  stars: number;
  openIssues: number;
  /** ISO date of the newest commit on the default branch; null for empty repos. */
  lastCommitAt: string | null;
  /** Epoch ms when these stats were fetched. */
  fetchedAt: number;
}

export type AppErrorKind = "rate_limit" | "not_found" | "network" | "aborted" | "http";

/** Serializable error shape so it can live in Redux state. */
export interface AppError {
  kind: AppErrorKind;
  message: string;
  status?: number;
}

/** Subset of the GitHub REST payloads we actually read. */
export interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  owner: { login: string; avatar_url: string };
}

export interface GhSearchResponse {
  total_count: number;
  items: GhRepo[];
}

export interface GhCommit {
  commit: { committer: { date: string } | null; author: { date: string } | null };
}
