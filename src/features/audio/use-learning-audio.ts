import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { getLearningAudioPath, hasLearningAudioRecording, type LearningAudioLookup } from '@/content/learning-audio';
import { resolveDownloadedAudioSource } from '@/services/lesson-downloads';

export type LearningAudioSpeed = 'normal' | 'slow';
export type LearningAudioKind = 'recording' | 'device' | null;

export interface LearningAudioRequest extends LearningAudioLookup {
  key: string;
  locale: string;
  source?: AudioSource | null;
}

export function useLearningAudio() {
  const player = useAudioPlayer(null, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [speed, setSpeed] = useState<LearningAudioSpeed>('normal');
  const [kind, setKind] = useState<LearningAudioKind>(null);
  const requestSequence = useRef(0);

  const stop = useCallback(() => {
    requestSequence.current += 1;
    player.pause();
    Speech.stop();
    setActiveKey(null);
    setKind(null);
  }, [player]);

  useEffect(() => () => {
    requestSequence.current += 1;
    player.pause();
    Speech.stop();
  }, [player]);

  const sourceFor = useCallback(async (request: LearningAudioRequest) => {
    if (request.source) return request.source;
    const path = getLearningAudioPath(request);
    return path ? resolveDownloadedAudioSource(path) : null;
  }, []);

  const hasRecording = useCallback((request: LearningAudioRequest) => (
    Boolean(request.source) || hasLearningAudioRecording(request)
  ), []);

  const play = useCallback(async (request: LearningAudioRequest, nextSpeed: LearningAudioSpeed = 'normal') => {
    const sequence = ++requestSequence.current;
    player.pause();
    Speech.stop();
    const source = await sourceFor(request);
    if (sequence !== requestSequence.current) return;
    setActiveKey(request.key);
    setSpeed(nextSpeed);

    if (source) {
      setKind('recording');
      player.replace(source);
      player.setPlaybackRate(nextSpeed === 'slow' ? 0.72 : 1, 'high');
      player.play();
      return;
    }

    setKind('device');
    Speech.speak(request.text, {
      language: request.locale,
      rate: nextSpeed === 'slow' ? 0.58 : 0.78,
      pitch: 1,
      onDone: () => { setActiveKey(null); setKind(null); },
      onStopped: () => { setActiveKey(null); setKind(null); },
      onError: () => { setActiveKey(null); setKind(null); },
    });
  }, [player, sourceFor]);

  const recordingFinished = kind === 'recording' && status.didJustFinish;

  return {
    activeKey: recordingFinished ? null : activeKey,
    hasRecording,
    isPlaying: !recordingFinished && Boolean(activeKey) && (kind === 'device' || status.playing),
    kind: recordingFinished ? null : kind,
    play,
    speed,
    stop,
  };
}
