import excelLearnings from '../src/data/excelLearnings.json' with { type: 'json' };
import { FRAMEWORK_LEARNINGS } from '../src/data/frameworkLearnings.js';

const learnings = [...excelLearnings, ...FRAMEWORK_LEARNINGS];
const ids = new Set(learnings.map(learning => learning.id));
const contentKeys = new Set(learnings.map(learning => (
  `${learning.title}|${learning.description}`.replace(/\s+/g, ' ').toLowerCase()
)));
const sourceCells = new Set(excelLearnings.map(learning => learning.source_cell));
const categories = [...new Set(learnings.map(learning => learning.category))].sort();

const result = {
  excel: excelLearnings.length,
  framework: FRAMEWORK_LEARNINGS.length,
  total: learnings.length,
  uniqueIds: ids.size,
  uniqueContent: contentKeys.size,
  uniqueExcelSourceCells: sourceCells.size,
  categories,
  sourced: learnings.filter(learning => learning.source).length,
  evidenceLabeledFramework: FRAMEWORK_LEARNINGS.filter(learning => learning.evidence_status).length,
};

console.log(result);

if (
  result.excel !== 26
  || result.framework !== 16
  || result.total !== 42
  || result.uniqueIds !== 42
  || result.uniqueContent !== 42
  || result.uniqueExcelSourceCells !== 26
  || result.sourced !== 42
  || result.evidenceLabeledFramework !== 16
) {
  process.exit(1);
}