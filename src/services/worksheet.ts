import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { LanguageCourse, StarterLesson } from '@/models';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

export function buildWorksheetHtml(course: LanguageCourse, lesson: StarterLesson) {
  const rows = lesson.units.map((unit, index) => `
    <section class="unit" dir="${course.direction}">
      <div class="number">${index + 1}</div>
      <div class="model">${escapeHtml(unit.symbol)}</div>
      <div class="label">${escapeHtml(unit.romanization)} · ${escapeHtml(unit.soundHint)}</div>
      <div class="trace">${escapeHtml(unit.symbol)} &nbsp; ${escapeHtml(unit.symbol)} &nbsp; ${escapeHtml(unit.symbol)}</div>
      <div class="lines"><span></span><span></span></div>
    </section>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    @page { margin: 28px; }
    body { color: #19342F; font-family: Arial, 'Noto Sans', sans-serif; margin: 0; }
    header { border-bottom: 4px solid #F26B4F; padding-bottom: 14px; }
    h1 { margin: 0; font-size: 28px; } h2 { color: #687A75; font-size: 16px; font-weight: 500; margin: 5px 0 0; }
    .meta { display: flex; gap: 28px; font-size: 12px; margin: 16px 0 20px; }
    .line { border-bottom: 1px solid #687A75; display: inline-block; min-width: 160px; }
    .unit { break-inside: avoid; border: 1px solid #E5E4D8; border-radius: 14px; margin: 0 0 12px; padding: 12px 14px; position: relative; }
    .number { background: ${course.color}; border-radius: 8px; color: ${course.accentColor}; font-weight: 700; left: 12px; padding: 5px 8px; position: absolute; top: 12px; }
    .model { font-size: 38px; font-weight: 700; text-align: center; }
    .label { color: #687A75; font-size: 12px; text-align: center; }
    .trace { color: #D6D8D2; font-size: 30px; letter-spacing: 8px; margin-top: 9px; text-align: center; }
    .lines span { border-bottom: 1px dashed #A7B0AC; display: block; height: 22px; }
    footer { color: #687A75; font-size: 9px; margin-top: 14px; text-align: center; }
  </style></head><body><header><h1>Lipi · ${escapeHtml(course.name)} worksheet</h1><h2>${escapeHtml(lesson.title)}</h2></header>
  <div class="meta">Name: <span class="line"></span> Date: <span class="line"></span></div>${rows}
  <footer>Look · Listen · Say · Trace · Write · Review</footer></body></html>`;
}

export async function printWorksheet(course: LanguageCourse, lesson: StarterLesson) {
  const html = buildWorksheetHtml(course, lesson);
  await Print.printAsync({ html });
}

export async function shareWorksheetPdf(course: LanguageCourse, lesson: StarterLesson) {
  const html = buildWorksheetHtml(course, lesson);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `${course.name} worksheet` });
  }
}
