import type { Goal, Profile } from "./types";

export interface ScoredMatch {
  profile: Profile;
  score: number;
  sharedInterests: string[];
  complementarySkills: string[];
  sharedGoals: Goal[];
  why: string;
  conversationTopics: string[];
}
