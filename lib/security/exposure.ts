import exposure from '@/api-legacy/_lib/exposure.js';

export const {
  publicOrigin,
  isPrivateMode,
  isSensitiveRepo,
  redactRepoName,
  sanitizePublicPayload,
  sanitizeGithubStats,
  sanitizePortfolio,
  sanitizeRepos,
  sanitizeNarrative,
  sanitizeInfra,
  sanitizeLanguageStats,
  sanitizeHealth,
} = exposure as {
  publicOrigin: () => string;
  isPrivateMode: () => boolean;
  isSensitiveRepo: (repo: string) => boolean;
  redactRepoName: (repo: string) => string;
  sanitizePublicPayload: <T>(kind: string, data: T) => T;
  sanitizeGithubStats: <T>(data: T) => T;
  sanitizePortfolio: <T>(data: T) => T;
  sanitizeRepos: <T>(data: T) => T;
  sanitizeNarrative: <T>(data: T) => T;
  sanitizeInfra: <T>(data: T) => T;
  sanitizeLanguageStats: <T>(data: T) => T;
  sanitizeHealth: <T>(data: T) => T;
};
