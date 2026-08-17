import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { getLearningAudioPath, hasLearningAudioRecording, type LearningAudioLookup } from '@/content/learning-audio';
import { resolveAvailableAudioSource, type AvailableAudioSource } from '@/services/lesson-downloads';

export type LearningAudioSpeed = 'normal' | 'slow';
export type LearningAudioKind = 'recording' | 'streaming' | 'device' | null;

export interface LearningAudioRequest extends LearningAudioLookup {
  key: string;
  locale: string;
  source?: AudioSource | null;
}

export function useLearningAudio() {
  const player = useAudioPlayer(null, { downloadFirst: false, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [speed, setSpeed] = useState<LearningAudioSpeed>('normal');
  const [kind, setKind] = useState<LearningAudioKind>(null);
  const requestSequence = useRef(0);
  const activeRequest = useRef<LearningAudioRequest | null>(null);

  const stop = useCallback(() => {
    requestSequence.current += 1;
    player.pause();
    Speech.stop();
    activeRequest.current = null;
    setActiveKey(null);
    setKind(null);
  }, [player]);

  useEffect(() => () => {
    requestSequence.current += 1;
    player.pause();
    Speech.stop();
    activeRequest.current = null;
  }, [player]);

  const sourceFor = useCallback(async (request: LearningAudioRequest): Promise<AvailableAudioSource | null> => {
    if (request.source) return { kind: 'offline', source: request.source };
    const path = getLearningAudioPath(request);
    return path ? resolveAvailableAudioSource(path) : null;
  }, []);

  const hasRecording = useCallback((request: LearningAudioRequest) => (
    Boolean(request.source) || hasLearningAudioRecording(request)
  ), []);

  const speakWithDevice = useCallback((request: LearningAudioRequest, nextSpeed: LearningAudioSpeed) => {
    activeRequest.current = request;
    setActiveKey(request.key);
    setKind('device');
    Speech.speak(request.text, {
      language: request.locale,
      rate: nextSpeed === 'slow' ? 0.58 : 0.78,
      pitch: 1,
      onDone: () => { activeRequest.current = null; setActiveKey(null); setKind(null); },
      onStopped: () => { activeRequest.current = null; setActiveKey(null); setKind(null); },
      onError: () => { activeRequest.current = null; setActiveKey(null); setKind(null); },
    });
  }, []);

  const play = useCallback(async (request: LearningAudioRequest, nextSpeed: LearningAudioSpeed = 'normal') => {
    const sequence = ++requestSequence.current;
    player.pause();
    Speech.stop();
    const available = await sourceFor(request);
    if (sequence !== requestSequence.current) return;
    activeRequest.current = request;
    setActiveKey(request.key);
    setSpeed(nextSpeed);

    if (available) {
      setKind(available.kind === 'streaming' ? 'streaming' : 'recording');
      player.replace(available.source);
      player.setPlaybackRate(nextSpeed === 'slow' ? 0.72 : 1, 'high');
      player.play();
      return;
    }

    speakWithDevice(request, nextSpeed);
  }, [player, sourceFor, speakWithDevice]);

  useEffect(() => {
    if (kind !== 'streaming' || !status.error || !activeRequest.current) return;
    const request = activeRequest.current;
    player.pause();
    Speech.stop();
    speakWithDevice(request, speed);
  }, [kind, player, speakWithDevice, speed, status.error]);

  const recordingFinished = (kind === 'recording' || kind === 'streaming') && status.didJustFinish;

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
