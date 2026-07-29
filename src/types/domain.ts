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

export type SessionStatus =
  | "connecting"
  | "active"
  /** Learner pressed End — optimistic; the webhook/sweep actually completes. */
  | "ending"
  | "completed"
  | "failed";

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
  role: Role;
}

export type CefrLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type Role = "learner" | "admin";

export type AttemptStatus = "in_progress" | "completed" | "abandoned";

export interface Topic {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient_from: string;
  gradient_to: string;
  sequence_order: number;
  cefr_level: CefrLevel | null;
  estimated_minutes: number;
  level_count: number;
  /** True once at least one attempt has been completed. */
  completed: boolean;
  /** Completed attempts only — topics are repeatable. */
  attempt_count: number;
  last_practised_at: string | null;
}

export interface TopicLevel {
  id: number;
  level: number;
  title: string;
  conversation_guide: string | null;
  target_vocabulary: string[];
  target_grammar: string[];
}

export interface TopicAttempt {
  id: number;
  attempt_number: number;
  status: AttemptStatus;
  /** Null until real scoring exists — never fabricated. */
  score: number | null;
  xp_earned: number;
  topic_level_id: number | null;
  practice_session_id: number | null;
  started_at: string | null;
  completed_at: string | null;
}

/** GET /topics/:id returns the list shape plus teaching content and history. */
export interface TopicDetail extends Topic {
  conversation_guide: string | null;
  target_vocabulary: string[];
  target_grammar: string[];
  levels: TopicLevel[];
  attempts: TopicAttempt[];
}

/** Admin-only shape: includes fields learners never see. */
export interface AdminTopic extends Omit<Topic, "completed" | "attempt_count" | "last_practised_at"> {
  active: boolean;
  conversation_guide: string | null;
  opening_line: string | null;
  target_vocabulary: string[];
  target_grammar: string[];
  updated_at: string;
}

export interface PracticeSession {
  id: number;
  session_type: SessionType;
  status: SessionStatus;
  topic_id: number | null;
  livekit_room_name: string;
  duration_seconds: number | null;
  /** Denormalized at completion; 0 until the session completes. */
  turn_count: number;
  learner_word_count: number;
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

/**
 * A persisted utterance, served from transcript_messages rows. The old
 * jsonb-blob shape (index/timestamp) is gone along with the blob itself.
 */
export interface TranscriptMessage {
  sequence: number;
  speaker: Speaker;
  text: string;
  spoke_started_at: string | null;
  spoke_ended_at?: string | null;
  /**
   * Position within the session recording, derived server-side by
   * subtracting the egress start time from the absolute speech timestamp.
   * Null when there is no recording. Can legitimately be negative: a
   * learner can speak before the egress worker has spun up, so clamp to 0
   * when seeking rather than treating it as invalid.
   */
  offset_start_ms?: number | null;
  offset_end_ms?: number | null;
  interrupted?: boolean;
}

/**
 * Mirrors LiveKit's EgressStatus (prefix dropped, lowercased), plus
 * "starting" for the window between our row insert and LiveKit accepting
 * the request, and "unavailable" for a session that has no recording row
 * at all.
 */
export type RecordingStatus =
  | "unavailable"
  | "starting"
  | "active"
  | "ending"
  | "complete"
  | "failed"
  | "aborted"
  | "limit_reached";

/**
 * Playback details for a session recording.
 *
 * `url` is a presigned link minted per request, not a stored one — it is
 * only present when the file actually landed in the bucket, and it expires
 * after `expires_in` seconds. A "complete" egress whose upload failed has
 * no key and therefore no url.
 */
export interface SessionRecording {
  status: RecordingStatus;
  duration_ms: number | null;
  recording_started_at: string | null;
  url?: string;
  expires_in?: number;
}

export type FeedbackStatus =
  | "pending"
  | "generating"
  | "ready"
  | "insufficient_data"
  | "failed";

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
  category?: string;
}

export interface VocabularyUpgrade {
  used: string;
  suggestion: string;
  why: string;
  example_sentence?: string;
}

export interface FluencyAssessment {
  summary?: string;
  hesitation_pattern?: string;
  pacing_note?: string;
}

export interface ConversationStats {
  turn_count?: number;
  learner_turn_count?: number;
  learner_word_count?: number;
  unique_word_count?: number;
  vocabulary_richness?: number;
  filler_word_count?: number;
  longest_turn_words?: number;
  avg_turn_words?: number;
  words_per_minute?: number | null;
  duration_seconds?: number | null;
}

/**
 * Real Gemini analysis over the real transcript. When status is "failed"
 * the UI says feedback is unavailable — there is no fallback content.
 */
export interface SessionFeedback {
  status: FeedbackStatus;
  grammar_corrections?: GrammarCorrection[];
  vocabulary_upgrades?: VocabularyUpgrade[];
  fluency_assessment?: FluencyAssessment;
  strengths?: string[];
  overall_summary?: string | null;
  conversation_stats?: ConversationStats;
  generated_at?: string | null;
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
