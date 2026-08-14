export type Skill = 'recognition' | 'listening' | 'pronunciation' | 'writing' | 'recall';

interface ActivityBase {
  id: string;
  unitId: string;
  languageId: string;
  title: string;
  prompt: string;
  skill: Skill;
}

export interface IdentifyUnitActivity extends ActivityBase {
  type: 'identify-unit';
  choices: string[];
  correctUnitId: string;
}

export interface TraceUnitActivity extends ActivityBase {
  type: 'trace-unit';
  guidePath: string;
  strokeCount: number;
}

export interface ListenAndChooseActivity extends ActivityBase {
  type: 'listen-and-choose';
  audioAsset: string;
  choices: string[];
  correctUnitId: string;
}

export interface SpeakUnitActivity extends ActivityBase {
  type: 'speak-unit';
  referenceAudioAsset: string;
  expectedPhonemeIds: string[];
}

export interface RecallUnitActivity extends ActivityBase {
  type: 'recall-unit';
  answerUnitId: string;
  hint?: string;
}

export type Activity =
  | IdentifyUnitActivity
  | TraceUnitActivity
  | ListenAndChooseActivity
  | SpeakUnitActivity
  | RecallUnitActivity;
