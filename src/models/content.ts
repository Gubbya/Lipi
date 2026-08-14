import type { Activity } from './activity';
import type { Language } from './language';
import type { Phoneme } from './phonetics';
import type { GraphemePhonemeMapping, OrthographicUnit } from './writing';

export interface ContentLevel {
  id: string;
  languageId: string;
  title: string;
  description?: string;
  focus?: string;
  order: number;
  unitIds: string[];
}

export interface ContentPackage {
  id: string;
  schemaVersion: 1;
  language: Language;
  levels: ContentLevel[];
  units: OrthographicUnit[];
  phonemes: Phoneme[];
  mappings: GraphemePhonemeMapping[];
  activities: Activity[];
}
