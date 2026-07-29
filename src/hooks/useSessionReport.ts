import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import type {
  RecordingResponse,
  SessionResponse,
  TranscriptResponse,
} from "../types/api";
import type {
  PracticeSession,
  SessionRecording,
  TranscriptMessage,
} from "../types/domain";

interface Report {
  session: PracticeSession | null;
  transcript: TranscriptMessage[];
  recording: SessionRecording | null;
  loading: boolean;
  notFound: boolean;
}

/**
 * Loads everything the report screen shows.
 *
 * The four endpoints are fetched in parallel and settled independently:
 * audio and feedback are produced by two processes that race each other
 * (an egress upload and a Gemini call), so neither may block the other or
 * the page waits on the slowest thing that might never arrive.
 */
export function useSessionReport(sessionId: number | null) {
  const [state, setState] = useState<Report>({
    session: null,
    transcript: [],
    recording: null,
    loading: true,
    notFound: false,
  });

  const loadRecording = useCallback(async (): Promise<SessionRecording | null> => {
    if (!sessionId) return null;
    try {
      const { data } = await api.get<RecordingResponse>(
        `/practice_sessions/${sessionId}/recording`
      );
      return data.recording;
    } catch {
      return null;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    Promise.allSettled([
      api.get<SessionResponse>(`/practice_sessions/${sessionId}`),
      api.get<TranscriptResponse>(`/practice_sessions/${sessionId}/transcript`),
      loadRecording(),
    ]).then(([sessionRes, transcriptRes, recordingRes]) => {
      if (cancelled) return;

      // Only a missing session is "not found" — a session with no recording
      // or no transcript is a perfectly normal session.
      if (sessionRes.status === "rejected") {
        setState((s) => ({ ...s, loading: false, notFound: true }));
        return;
      }

      setState({
        session: sessionRes.value.data.practice_session,
        transcript:
          transcriptRes.status === "fulfilled"
            ? transcriptRes.value.data.transcript.messages
            : [],
        recording: recordingRes.status === "fulfilled" ? recordingRes.value : null,
        loading: false,
        notFound: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId, loadRecording]);

  /**
   * Re-mints the playback URL. Presigned links expire after 15 minutes, so
   * a report left open in a tab will eventually fail to play — this is what
   * the player calls on an audio error rather than showing a dead control.
   */
  const refreshRecording = useCallback(async () => {
    const recording = await loadRecording();
    if (recording) setState((s) => ({ ...s, recording }));
    return recording;
  }, [loadRecording]);

  return { ...state, refreshRecording };
}
