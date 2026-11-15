// Self-check for the draw engine. Run: npm run check
import assert from "node:assert/strict";
import { bracketOrder, groupConfigs, makeGroups, pickLuckyLoser, plan, randomPairs, recommend, rollingRound, roundRobin, shuffle, standardRound1, swissRound } from "../src/lib/draw";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${String(i + 1).padStart(3, "0")}`);
const flat = (pairs: { a: string; b: string | null }[]) => pairs.flatMap((p) => (p.b ? [p.a, p.b] : [p.a]));
const sameSet = (a: string[], b: string[]) => assert.deepEqual([...a].sort(), [...b].sort());

// Reproducible: same seed same order, different seed different order, nobody lost
assert.deepEqual(shuffle(ids(50), "A1B2"), shuffle(ids(50), "A1B2"));
assert.notDeepEqual(shuffle(ids(50), "A1B2"), shuffle(ids(50), "A1B3"));
sameSet(shuffle(ids(50), "X"), ids(50));

// Bracket order: seed s meets P+1-s
assert.deepEqual(bracketOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);

// Standard: 24 → 8 byes, 8 matches, a bye never meets a bye, everyone placed once
for (const n of [24, 90, 61, 32, 5]) {
  const r = standardRound1(ids(n), "S");
  const P = 2 ** Math.ceil(Math.log2(n));
  assert.equal(r.length, P / 2);
  assert.equal(r.filter((p) => !p.b).length, P - n, `byes for ${n}`);
  sameSet(flat(r), ids(n));
}

// Rolling: odd field gets exactly one bye, never to someone who had one
{
  const r = rollingRound(ids(45), new Set(), "R");
  assert.equal(r.pairs.filter((p) => !p.b).length, 1);
  sameSet(flat(r.pairs), ids(45));
  const had = new Set(ids(45).slice(0, 44)); // only p045 hasn't had a bye
  assert.equal(rollingRound(ids(45), had, "R").bye, "p045");
  assert.equal(rollingRound(ids(90), new Set(), "R").bye, null);
  assert.ok(rollingRound(ids(3), new Set(ids(3)), "R").bye, "falls back when everyone had a bye");
}

// Lucky loser: smallest margin wins; unknown margins rank last
assert.equal(pickLuckyLoser([{ id: "a", margin: 5 }, { id: "b", margin: 2 }, { id: "c", margin: null }], "L"), "b");
assert.ok(["a", "b"].includes(pickLuckyLoser([{ id: "a", margin: null }, { id: "b", margin: null }], "L")));

// Pairs: odd count leaves exactly one out
{
  const r = randomPairs(ids(119), "P");
  assert.equal(r.pairs.length, 59);
  assert.ok(r.leftover);
  sameSet([...r.pairs.flat(), r.leftover!], ids(119));
}

// Groups: sizes differ by at most one; round robin plays each pair once, nobody twice a round
{
  const g = makeGroups(ids(90), 16, "G");
  const sizes = g.map((x) => x.length);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  sameSet(g.flat(), ids(90));
  for (const n of [3, 5, 6]) {
    const rr = roundRobin(ids(n));
    const seen = new Set(rr.flat().map(([a, b]) => [a, b].sort().join()));
    assert.equal(seen.size, (n * (n - 1)) / 2);
    for (const round of rr) assert.equal(new Set(round.flat()).size, round.length * 2);
  }
  const c = groupConfigs(90)[0];
  assert.equal(c.sizes.reduce((a, b) => a + b), 90);
  assert.ok(Number.isInteger(Math.log2(c.knockout)), "knockout is a power of 2");
}

// Swiss: no rematch when avoidable; bye goes to the lowest scorer without one
{
  const players = ids(5).map((id, i) => ({ id, points: 4 - i, hadBye: id === "p005" }));
  const r = swissRound(players, new Set(["p001|p002"]), "W");
  assert.equal(r.bye, "p004");
  assert.ok(!r.pairs.some((p) => [p.a, p.b].sort().join("|") === "p001|p002"));
}

// Planner: 90 table tennis players, 4 tables, 15 min slots
{
  const p = plan(90, { courts: 4, slot: 15 });
  const by = Object.fromEntries(p.map((x) => [x.method, x]));
  assert.equal(by.standard.byes, 38);
  assert.equal(by.rolling.byes, 3); // 45, 23 and 3 are odd
  assert.deepEqual(by.rolling.fields, [90, 45, 23, 12, 6, 3, 2]);
  assert.equal(by.groups.byes, 0);
  assert.equal(by.lucky_loser.byes, 0);
  assert.ok(recommend(p));
}
console.log("draw ok");
