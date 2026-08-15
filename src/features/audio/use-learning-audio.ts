import { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { getLearningAudioSource, type LearningAudioLookup } from '@/content/learning-audio';

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

  const stop = useCallback(() => {
    player.pause();
    Speech.stop();
    setActiveKey(null);
    setKind(null);
  }, [player]);

  useEffect(() => () => {
    player.pause();
    Speech.stop();
  }, [player]);

  const sourceFor = useCallback((request: LearningAudioRequest) => (
    request.source ?? getLearningAudioSource(request)
  ), []);

  const hasRecording = useCallback((request: LearningAudioRequest) => Boolean(sourceFor(request)), [sourceFor]);

  const play = useCallback((request: LearningAudioRequest, nextSpeed: LearningAudioSpeed = 'normal') => {
    const source = sourceFor(request);
    player.pause();
    Speech.stop();
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
