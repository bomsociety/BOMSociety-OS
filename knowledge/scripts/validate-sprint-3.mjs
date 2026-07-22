import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../objects/', import.meta.url);
const schema = JSON.parse(await readFile(new URL('../schemas/bomgraph-node.schema.json', import.meta.url)));
const dirs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
const requiredTopics = ['artificial-intelligence', 'asc-ownership', 'employment-contracts', 'physician-wealth', 'private-equity', 'rvu-compensation'];
const errors = [];

if (JSON.stringify(dirs) !== JSON.stringify(requiredTopics)) errors.push(`expected topic directories ${requiredTopics.join(', ')}`);
for (const slug of dirs) {
  const file = join(root.pathname, slug, 'knowledge-object.json');
  const node = JSON.parse(await readFile(file, 'utf8'));
  for (const key of schema.required) if (!(key in node)) errors.push(`${slug}: missing Sprint 2 required field ${key}`);
  if (!schema.properties.type.enum.includes(node.type)) errors.push(`${slug}: invalid Sprint 2 node type`);
  if (!Array.isArray(node.references) || node.references.length) errors.push(`${slug}: references must be an empty array until evidence is attached`);
  if (node.canonical_kind !== 'knowledge_object') errors.push(`${slug}: incorrect canonical kind`);
  if (node.decision_objects?.length !== 5) errors.push(`${slug}: expected five decision objects`);
  if (node.claims?.length !== 5 || node.evidence_placeholders?.length !== 5 || node.corroboration_records?.length !== 5) errors.push(`${slug}: expected five claims, evidence placeholders, and corroboration records`);
  if (node.relationships?.length !== 5) errors.push(`${slug}: expected five relationships`);
  if (node.lessons?.length !== 10 || node.learning_path?.ordered_lesson_ids?.length !== 10) errors.push(`${slug}: expected ten ordered lessons`);
  for (const lesson of node.lessons ?? []) {
    if (lesson.id !== node.learning_path.ordered_lesson_ids[lesson.order - 1]) errors.push(`${slug}: lesson ${lesson.order} is not correctly ordered in its learning path`);
    for (const depth of ['seconds_30', 'minutes_2', 'minutes_5']) if (!lesson.versions?.[depth]?.trim()) errors.push(`${slug}: lesson ${lesson.order} lacks ${depth}`);
  }
  for (const evidence of node.evidence_placeholders ?? []) {
    if (evidence.status !== 'empty_placeholder' || Object.values(evidence.citation ?? {}).some((value) => Array.isArray(value) ? value.length : value)) errors.push(`${slug}: evidence placeholder ${evidence.id} contains a fabricated citation`);
  }
}
if (errors.length) throw new Error(`Sprint 3 knowledge validation failed:\n- ${errors.join('\n- ')}`);
console.log(`Validated ${dirs.length} knowledge objects, ${dirs.length * 5} decision objects, ${dirs.length * 5} claims, ${dirs.length * 5} empty evidence placeholders, ${dirs.length * 5} corroboration records, ${dirs.length * 5} relationships, ${dirs.length} learning paths, and ${dirs.length * 10} lessons.`);
