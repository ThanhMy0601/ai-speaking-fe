/**
 * Domain types — the frozen contract between this app and the Rails API.
 *
 * Every field here mirrors a Rails serializer (the private `*_json` methods
 * in app/controllers/api/v1/). Keep them in sync: if a serializer changes,
 * change it here in the same PR. This file is the single source of truth —
 * do not redeclare these shapes inline in stores or components.
 */

export type LearningGoal =
  | "general_conversation"
  | "business_english"
  | "travel"
  | "academic";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

/** IELTS mock test and role-play were removed in Phase 2. */
export type SessionType = "free_practice";

export type SessionStatus = "connecting" | "active" | "completed" | "failed";

export type Speaker = "learner" | "ai";

export interface User {
  id: number;
  email: string;
  display_name: string;
  learning_goal: LearningGoal | null;
  proficiency_level: ProficiencyLevel | null;
  onboarding_completed: boolean;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  total_practice_hours: number;
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient_from: string;
  gradient_to: string;
  sequence_order: number;
  completed: boolean;
}

export interface PracticeSession {
  id: number;
  session_type: SessionType;
  status: SessionStatus;
  livekit_room_name: string;
  duration_seconds: number | null;
  /**
   * Always null today. The only thing that ever wrote it was a mock
   * scorer returning rand(50..95); real per-word scoring is a later
   * phase. Render "—" rather than inventing a number.
   */
  overall_score: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface TranscriptMessage {
  index: number;
  speaker: Speaker;
  text: string;
  timestamp: string;
  pronunciation_score?: number;
}

export interface Achievement {
  key: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  earned_at: string;
}

export interface Progress {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  total_practice_hours: number;
  topics_completed: number;
  sessions_completed: number;
}
