import { courseCatalog } from '../src/content/course-catalog';
import { validateMarathiCurriculum } from '../src/content/marathi-curriculum';
import { phrasebook } from '../src/content/phrasebook';

validateMarathiCurriculum();

const expected: Record<string, { lessons: number; units: number }> = {
  hi: { lessons: 13, units: 112 }, fr: { lessons: 12, units: 89 },
  es: { lessons: 11, units: 87 }, it: { lessons: 11, units: 86 },
  de: { lessons: 11, units: 91 }, ru: { lessons: 11, units: 93 },
  ar: { lessons: 13, units: 91 }, zh: { lessons: 16, units: 123 },
  ja: { lessons: 19, units: 162 }, ko: { lessons: 12, units: 102 },
  kn: { lessons: 15, units: 114 }, pa: { lessons: 12, units: 96 },
  gu: { lessons: 13, units: 111 }, te: { lessons: 15, units: 116 },
  sa: { lessons: 15, units: 116 },
};

const requiredSections = new Set([
  'Letters & script',
  'Sounds & spelling',
  'Numbers & vocabulary',
  'Sentences & conversation',
]);

const courses = courseCatalog.filter((course) => expected[course.id]);
if (courses.length !== Object.keys(expected).length) throw new Error(`Expected 15 expanded courses, found ${courses.length}`);

for (const course of courses) {
  const target = expected[course.id];
  const unitCount = course.lessons.reduce((total, lesson) => total + lesson.units.length, 0);
  if (course.lessons.length !== target.lessons) throw new Error(`${course.id}: expected ${target.lessons} lessons, found ${course.lessons.length}`);
  if (unitCount !== target.units) throw new Error(`${course.id}: expected ${target.units} units, found ${unitCount}`);
  if ((phrasebook[course.id] ?? []).length !== 11) throw new Error(`${course.id}: expected 11 phrases`);
  const sections = new Set(course.lessons.map((lesson) => lesson.section).filter(Boolean));
  for (const section of requiredSections) if (!sections.has(section)) throw new Error(`${course.id}: missing ${section}`);
}

const lessonCount = courses.reduce((total, course) => total + course.lessons.length, 0);
const unitCount = courses.reduce((total, course) => total + course.lessons.reduce((sum, lesson) => sum + lesson.units.length, 0), 0);
console.log(`Curriculum validation passed: ${courses.length} courses, ${lessonCount} lessons, ${unitCount} units, and 11 phrases each.`);
