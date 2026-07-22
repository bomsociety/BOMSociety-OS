import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../ghost-theme/home.hbs", import.meta.url), "utf8");
const analytics = await readFile(new URL("../ghost-theme/assets/js/analytics.js", import.meta.url), "utf8");
const layout = await readFile(new URL("../ghost-theme/default.hbs", import.meta.url), "utf8");

test("homepage retains the required hero promise and calls to action", () => {
  assert.match(home, /Make better business decisions in medicine\./);
  assert.match(home, /Clear, corroborated guidance for the decisions medical training never taught you to make\./);
  assert.match(home, />Join Free</);
  assert.match(home, />Explore Decisions</);
});

test("homepage has exactly six routed decision cards", () => {
  const cards = home.match(/data-decision-card/g) ?? [];
  assert.equal(cards.length, 6);
  assert.equal((home.match(/href="\{\{@site\.url\}\}\/topic\//g) ?? []).length, 6);
});

test("homepage keeps measurement and accessibility hooks", () => {
  assert.match(home, /data-track-section="hero"/);
  assert.match(home, /data-homepage-event="newsletter_signup"/);
  assert.match(home, /aria-label="BOMSociety principles"/);
  assert.match(analytics, /data-track-section/);
  assert.match(layout, /class="skip-link" href="#main"/);
});

test("BOMGraph is not a homepage section and latest Ghost posts remain queried", () => {
  assert.doesNotMatch(home, /id="bomgraph"/i);
  assert.doesNotMatch(home, /BOMGraph/i);
  assert.match(home, /\{\{#get "posts" limit="6" include="tags,authors"\}\}/);
});
