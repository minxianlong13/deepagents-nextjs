#!/usr/bin/env node

// Retrieval evaluation for document_search.
//
//   pnpm eval                          run with the default threshold
//   pnpm eval -- --min-score 0.4       try another threshold
//   pnpm eval -- --json out.json       also write per-question results
//
// Ranking metrics use raw search results; threshold metrics apply minScore
// the same way the MCP tool does.

import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { searchDocuments } from "../lib/document-search.mjs";
import { resolveDefaultMinScore } from "../tools/document-search.mjs";

const RETRIEVE_K = 10;
const TOOL_TOP_K = 4;

function parseArgs(argv) {
  const options = {
    file: new URL("./document-search.eval.json", import.meta.url),
    minScore: undefined,
    json: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--min-score") options.minScore = Number(argv[++i]);
    else if (arg === "--json") options.json = argv[++i];
    else if (arg === "--file") options.file = argv[++i];
    else if (arg !== "--") throw new Error(`Unknown argument: ${arg}`);
  }
  if (
    options.minScore !== undefined &&
    !(options.minScore >= 0 && options.minScore <= 1)
  ) {
    throw new Error("--min-score must be a number between 0 and 1");
  }
  return options;
}

function matches(source, expectedSources) {
  return expectedSources.some((expected) => source.includes(expected));
}

const pct = (n, d) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(0)}%`);
const fmt = (score) => (score === null || score === undefined ? "  -  " : score.toFixed(3));

async function evaluate(question, minScore) {
  const results = await searchDocuments(question.question, RETRIEVE_K);
  const topScore = results[0]?.score ?? null;
  const answerable = question.expectedSources.length > 0;

  if (!answerable) {
    return {
      ...question,
      answerable,
      topScore,
      topSource: results[0]?.source ?? null,
      correctlyEmpty: topScore === null || topScore < minScore,
    };
  }

  const rankIndex = results.findIndex((r) => matches(r.source, question.expectedSources));
  const rank = rankIndex === -1 ? null : rankIndex + 1;
  const hitScore = rankIndex === -1 ? null : results[rankIndex].score;
  return {
    ...question,
    answerable,
    rank,
    hitScore,
    topScore,
    topSource: results[0]?.source ?? null,
    hitAt1: rank === 1,
    hitAt4: rank !== null && rank <= TOOL_TOP_K,
    // What an agent actually receives: a correct chunk in the top 4 that also
    // clears the threshold.
    toolHit: rank !== null && rank <= TOOL_TOP_K && hitScore >= minScore,
  };
}

const options = parseArgs(process.argv.slice(2));
const minScore = options.minScore ?? resolveDefaultMinScore();
const evalSet = JSON.parse(await readFile(options.file, "utf8"));

const rows = [];
for (const question of evalSet.questions) {
  rows.push(await evaluate(question, minScore));
}

const answerable = rows.filter((r) => r.answerable);
const negatives = rows.filter((r) => !r.answerable);
const count = (list, key) => list.filter((r) => r[key]).length;
const mrr =
  answerable.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) /
  (answerable.length || 1);

console.log(`\nminScore ${minScore} | retrieve top ${RETRIEVE_K} | tool returns top ${TOOL_TOP_K}\n`);
console.log("result  rank  hit    top    id");
for (const r of answerable) {
  const status = r.toolHit ? "PASS" : r.hitAt4 ? "LOW " : "MISS";
  console.log(
    `${status}    ${String(r.rank ?? "-").padStart(4)}  ${fmt(r.hitScore)}  ${fmt(r.topScore)}  ${r.id}` +
      (r.toolHit ? "" : `  (top: ${r.topSource})`),
  );
}
for (const r of negatives) {
  console.log(
    `${r.correctlyEmpty ? "PASS" : "FAIL"}       -    -    ${fmt(r.topScore)}  ${r.id}` +
      (r.correctlyEmpty ? "" : "  (should return nothing)"),
  );
}

const categories = [...new Set(answerable.map((r) => r.category))];
console.log("\nBy category (tool hit):");
for (const category of categories) {
  const list = answerable.filter((r) => r.category === category);
  console.log(`  ${category.padEnd(12)} ${count(list, "toolHit")}/${list.length}`);
}

const summary = {
  minScore,
  answerable: answerable.length,
  negatives: negatives.length,
  hitAt1: count(answerable, "hitAt1"),
  hitAt4: count(answerable, "hitAt4"),
  toolHit: count(answerable, "toolHit"),
  mrr: Number(mrr.toFixed(3)),
  correctlyEmpty: count(negatives, "correctlyEmpty"),
};
console.log(`
Summary
  Hit@1                ${summary.hitAt1}/${summary.answerable} (${pct(summary.hitAt1, summary.answerable)})
  Hit@4                ${summary.hitAt4}/${summary.answerable} (${pct(summary.hitAt4, summary.answerable)})
  MRR@${RETRIEVE_K}               ${summary.mrr}
  Tool hit (>= min)    ${summary.toolHit}/${summary.answerable} (${pct(summary.toolHit, summary.answerable)})
  Negatives empty      ${summary.correctlyEmpty}/${summary.negatives} (${pct(summary.correctlyEmpty, summary.negatives)})

PASS: a correct chunk is in the top ${TOOL_TOP_K} and clears minScore.
LOW:  a correct chunk is in the top ${TOOL_TOP_K} but the threshold drops it.
MISS: no correct chunk in the top ${TOOL_TOP_K}.`);

if (options.json) {
  await writeFile(options.json, JSON.stringify({ summary, rows }, null, 2));
  console.log(`\nWrote ${options.json}`);
}
