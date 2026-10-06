/**
 * API response envelopes.
 *
 * Rails wraps every payload in a named key (`{ user: ... }`,
 * `{ topics: [...] }`), so these types describe the wrapper, not just the
 * resource. Import these instead of typing responses as `any`.
 */

import type {
  Achievement,
  AdminTopic,
  PracticeSession,
  Progress,
  SessionFeedback,
  SessionRecording,
  Topic,
  TopicAttempt,
  TopicDetail,
  TopicLevel,
  TranscriptMessage,
  User,
  VocabularyNote,
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
  topic: TopicDetail;
}

export interface TopicCompleteResponse {
  attempt: TopicAttempt;
  xp_earned?: number;
  achievements?: { key: string; title: string }[];
  already_completed?: boolean;
}

// --- Admin ---------------------------------------------------------------

export interface AdminTopicsResponse {
  topics: AdminTopic[];
}

export interface AdminTopicResponse {
  topic: AdminTopic & { levels: AdminTopicLevel[] };
}

export interface AdminTopicLevel extends TopicLevel {
  opening_line: string | null;
  active: boolean;
}

export interface AdminTopicLevelResponse {
  level: AdminTopicLevel & { topic_id: number };
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
}

/** GET /practice_sessions/:id/feedback — polled by the post-session screen. */
export interface FeedbackResponse {
  feedback: SessionFeedback;
}

/**
 * GET /practice_sessions/:id/recording — polled alongside feedback.
 *
 * Audio and feedback arrive independently (egress upload and the Gemini
 * call race each other), so the report screen renders each with its own
 * loading state rather than waiting for both.
 */
export interface RecordingResponse {
  recording: SessionRecording;
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

// --- Vocabulary ----------------------------------------------------------

export interface VocabularyNotesResponse {
  notes: VocabularyNote[];
}

export interface VocabularyNoteResponse {
  note: VocabularyNote;
}
