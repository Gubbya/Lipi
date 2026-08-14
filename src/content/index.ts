import type { Activity, ContentPackage, OrthographicUnit } from '@/models';
import englishPackageJson from './packages/english.json';
import { completeEnglishPhonemes, extendedEnglishActivities, extendedEnglishLevels, extendedEnglishMappings, extendedEnglishUnits } from './english-phonics-extended';

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Invalid content: ${path}`);
}

function validateContentPackage(value: unknown): ContentPackage {
  if (!value || typeof value !== 'object') throw new Error('Invalid content package');
  const candidate = value as Partial<ContentPackage>;
  assertString(candidate.id, 'id');
  if (candidate.schemaVersion !== 1) throw new Error('Unsupported content schema');
  if (!candidate.language || !Array.isArray(candidate.levels) || !Array.isArray(candidate.units) || !Array.isArray(candidate.phonemes) || !Array.isArray(candidate.mappings) || !Array.isArray(candidate.activities)) {
    throw new Error('Content package is missing required collections');
  }
  assertString(candidate.language.id, 'language.id');
  const unitIds = new Set(candidate.units.map((unit: OrthographicUnit) => unit.id));
  if (unitIds.size !== candidate.units.length) throw new Error('Content package contains duplicate unit ids');
  const levelIds = new Set(candidate.levels.map((level) => level.id));
  if (levelIds.size !== candidate.levels.length) throw new Error('Content package contains duplicate level ids');
  const activityIds = new Set(candidate.activities.map((activity) => activity.id));
  if (activityIds.size !== candidate.activities.length) throw new Error('Content package contains duplicate activity ids');
  candidate.units.forEach((unit: OrthographicUnit) => {
    assertString(unit.id, 'units[].id');
    if (unit.languageId !== candidate.language!.id) throw new Error(`Unit ${unit.id} belongs to another language`);
  });
  candidate.levels.flatMap((level) => level.unitIds).forEach((id) => {
    if (!unitIds.has(id)) throw new Error(`Level references unknown unit ${id}`);
  });
  candidate.activities.forEach((activity: Activity) => {
    assertString(activity.id, 'activities[].id');
    if (!unitIds.has(activity.unitId)) throw new Error(`Activity ${activity.id} references unknown unit`);
  });
  const phonemeIds = new Set(candidate.phonemes.map((phoneme) => phoneme.id));
  candidate.mappings.forEach((mapping) => {
    if (!unitIds.has(mapping.graphemeUnitId)) throw new Error(`Mapping ${mapping.id} references unknown unit`);
    mapping.phonemeIds.forEach((phonemeId) => {
      if (!phonemeIds.has(phonemeId)) throw new Error(`Mapping ${mapping.id} references unknown phoneme ${phonemeId}`);
    });
  });
  return candidate as ContentPackage;
}

const englishBase = validateContentPackage(englishPackageJson);
const englishComplete = validateContentPackage({
  ...englishBase,
  levels: [...englishBase.levels, ...extendedEnglishLevels],
  units: [...englishBase.units, ...extendedEnglishUnits],
  phonemes: completeEnglishPhonemes,
  mappings: [...englishBase.mappings, ...extendedEnglishMappings],
  activities: [...englishBase.activities, ...extendedEnglishActivities],
});
if (englishComplete.units.length !== 148) throw new Error(`English curriculum must contain 148 teaching units; found ${englishComplete.units.length}`);
if (englishComplete.phonemes.length !== 44) throw new Error(`English phoneme inventory must contain 44 phonemes; found ${englishComplete.phonemes.length}`);

const packages = [englishComplete];

export function getContentPackage(languageId: string): ContentPackage {
  const content = packages.find((item) => item.language.id === languageId);
  if (!content) throw new Error(`No bundled content for ${languageId}`);
  return content;
}

export function assertContentReference(languageId: string, unitId?: string | null, activityId?: string | null) {
  const content = getContentPackage(languageId);
  if (unitId && !content.units.some((unit) => unit.id === unitId)) throw new Error(`Unknown unit: ${unitId}`);
  if (activityId && !content.activities.some((activity) => activity.id === activityId)) throw new Error(`Unknown activity: ${activityId}`);
}

export const bundledContent = packages;
