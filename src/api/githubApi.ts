import type { SerializedError } from "@reduxjs/toolkit";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { searchRepositories, toAppError } from "./githubClient";
import type { AppError, RepoSummary } from "./types";

export const githubApi = createApi({
  reducerPath: "githubApi",
  baseQuery: fakeBaseQuery<AppError>(),
  endpoints: (build) => ({
    searchRepos: build.query<RepoSummary[], string>({
      queryFn: async (term, { signal }) => {
        try {
          return { data: await searchRepositories(term, signal) };
        } catch (e) {
          return { error: toAppError(e) };
        }
      },
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useSearchReposQuery } = githubApi;

export function toAppErrorFromQuery(error: AppError | SerializedError): AppError {
  if ("kind" in error) return error;
  return { kind: "http", message: error.message ?? "Something went wrong." };
}
