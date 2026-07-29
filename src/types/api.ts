/**
 * API response envelopes.
 *
 * Rails wraps every payload in a named key (`{ user: ... }`,
 * `{ topics: [...] }`), so these types describe the wrapper, not just the
 * resource. Import these instead of typing responses as `any`.
 */

import type {
  Achievement,
  PracticeSession,
  Progress,
  Topic,
  TranscriptMessage,
  User,
} from "./domain";

/** Rails renders validation failures as { errors: [...] } with 422. */
export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error?: string;
  errors?: ApiFieldError[];
  correlation_id?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface TopicsResponse {
  topics: Topic[];
}

export interface TopicResponse {
  topic: Topic;
}

export interface TopicCompleteResponse {
  completed: boolean;
  topic_id: number;
}

export interface CreateSessionResponse {
  practice_session: PracticeSession;
  livekit_token: string;
  livekit_url: string;
}

export interface SessionsResponse {
  practice_sessions: PracticeSession[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface SessionResponse {
  practice_session: PracticeSession;
  feedback: Record<string, unknown> | null;
}

export interface TranscriptResponse {
  transcript: {
    messages: TranscriptMessage[];
  };
}

export interface ProgressResponse {
  progress: Progress;
}

export interface StreaksResponse {
  current_streak: number;
  longest_streak: number;
  recent_activity: string[];
}

export interface AchievementsResponse {
  achievements: Achievement[];
}

export interface LivekitTokenResponse {
  token: string;
  livekit_url: string;
}
