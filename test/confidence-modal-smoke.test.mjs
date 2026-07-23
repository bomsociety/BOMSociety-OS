import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const file = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [home, main, css] = await Promise.all([
  file("ghost-theme/home.hbs"),
  file("ghost-theme/assets/js/main.js"),
  file("ghost-theme/assets/css/confidence-modal.css")
]);

test("production smoke: the homepage ships with an inert confidence modal", () => {
  assert.match(home, /data-decision-modal hidden aria-hidden="true"/);
  assert.match(css, /\.decision-modal\[hidden\]\{display:none!important;pointer-events:none\}/);
  assert.match(main, /const resetModal=.*modal\.hidden=true.*aria-hidden','true'.*removeProperty\('overflow'\).*removeProperty\('pointer-events'\).*removeItem\('bom-confidence-modal-open'/s);
  assert.match(main, /resetModal\(\);/);
  assert.doesNotMatch(main, /openModal\([^)]*,/);
  assert.doesNotMatch(main, /setTimeout\(\(\)=>openModal/);
  for (const event of ["DOMContentLoaded", "load", "scroll", "focus", "hashchange", "pageshow", "popstate"]) assert.doesNotMatch(main, new RegExp(`['\"]${event}['\"]`));
});

test("confidence modal opens only from its labeled trigger and all close paths reset it", () => {
  assert.match(home, /data-confidence-trigger>Set my confidence</);
  assert.match(main, /data-confidence-trigger.*addEventListener\('click',\(\)=>openModal\(trigger\)\)/);
  assert.match(main, /Array\.from\(\{length:11\}/);
  assert.match(main, /data-modal-close.*addEventListener\('click',closeModal\)/);
  assert.match(main, /e\.key==='Escape'&&!modal\?\.hidden\)closeModal\(\)/);
  assert.match(main, /if\(e\.target===modal\)closeModal\(\)/);
  assert.match(main, /if\(selectedConfidence===null\)return/);
  assert.match(main, /write\(key,s\);closeModal\(\);render\(\);/);
  assert.match(main, /returnFocus\?\.focus\(\)/);
});

test("desktop and mobile CSS retain an explicitly hidden, non-intercepting modal", () => {
  assert.match(css, /display:none!important/);
  assert.match(css, /pointer-events:none/);
  assert.match(main, /data-confidence="\$\{n\}"/); // The client renderer supplies all scores when explicitly opened.
});
