import type { Skill } from './activity';

export interface UnitMastery {
  userId: string;
  unitId: string;
  recognition: number;
  listening: number;
  pronunciation: number;
  writing: number;
  recall: number;
  totalAttempts: number;
  correctAttempts: number;
  streakCorrect: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  userId: string;
  activityId: string;
  languageId: string;
  unitId: string | null;
  skill: Skill;
  correct: boolean;
  score: number | null;
  userAnswer: string | null;
  expectedAnswer: string | null;
  durationMs: number | null;
  createdAt: string;
}
