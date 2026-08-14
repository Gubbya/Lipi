import type { Activity, ContentPackage, OrthographicUnit } from '@/models';
import englishPackageJson from './packages/english.json';

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
  return candidate as ContentPackage;
}

const packages = [validateContentPackage(englishPackageJson)];

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
