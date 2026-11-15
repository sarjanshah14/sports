// Self-check: plays whole tournaments with every method. Run: npm run check
import assert from "node:assert/strict";
import { groupConfigs, groupLabel, makeGroups, plan, rng, rollingRound, roundRobin, standardRound1, swissRound, type Method, type Options, type Pair } from "../src/lib/draw";
import { advancers, nextStep, parseScore, rePair, rearrangeable, standings, validPairs, type M, type Stage } from "../src/lib/rounds";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${String(i + 1).padStart(3, "0")}`);

function play(method: Method, n: number, o: Options) {
  const r = rng(`${method}${n}`);
  const ms: M[] = [];
  let id = 0;
  const add = (stage: Stage, round: number, pairs: Pair[], grp: string | null = null) =>
    pairs.forEach((p, i) => ms.push({ id: String(id++), stage, round, no: i + 1, grp, side_a: p.a, side_b: p.b, winner: p.b ? null : p.a, status: p.b ? "scheduled" : "bye", score: null }));
  const all = ids(n);
  if (method === "standard") add("knockout", 1, standardRound1(all, "s"));
  else if (method === "swiss") add("swiss", 1, swissRound(all.map((id) => ({ id, points: 0, hadBye: false })), new Set(), "s").pairs);
  else if (method === "groups") {
    const c = groupConfigs(n)[0];
    makeGroups(all, c.groups, "s").forEach((g, gi) => roundRobin(g).forEach((round, ri) => add("group", ri + 1, round.map(([a, b]) => ({ a, b })), groupLabel(gi))));
    o = { ...o, groups: { groups: c.groups, perGroup: c.perGroup } };
  } else add("knockout", 1, rollingRound(all, new Set(), "s").pairs);

  for (let step = 0; step < 200; step++) {
    for (const m of ms)
      if (m.status === "scheduled") {
        const x = 11 + Math.floor(r() * 10);
        const aWins = r() < 0.5;
        m.winner = aWins ? m.side_a : m.side_b;
        m.score = aWins ? `21-${x}` : `${x}-21`;
        m.status = "done";
      }
    const next = nextStep(method, o, ms, `seed${step}`);
    if (next.kind === "champion") return { champion: next.id, ms };
    if (next.kind === "tie") return { champion: next.ids[0], ms, tie: true };
    assert.equal(next.kind, "round", `${method} ${n} stuck: ${JSON.stringify(next)}`);
    if (next.kind !== "round") break;
    const seen = next.pairs.flatMap((p) => (p.b ? [p.a, p.b] : [p.a]));
    if (next.stage !== "final3") assert.equal(new Set(seen).size, seen.length, "nobody twice in a round");
    add(next.stage, next.round, next.pairs);
  }
  throw new Error(`${method} ${n} never finished`);
}

const o: Options = { courts: 4, slot: 15, finalThree: "round_robin" };
for (const n of [2, 3, 5, 7, 24, 61, 88, 90]) {
  for (const method of ["standard", "rolling", "lucky_loser", "swiss", "groups"] as Method[]) {
    if (method === "groups" && !groupConfigs(n).length) continue;
    const { champion, ms } = play(method, n, o);
    assert.ok(ids(n).includes(champion), `${method} ${n} champion`);
    const real = ms.filter((m) => m.side_b).length;
    const p = plan(n, o).find((x) => x.method === method)!;
    if (method === "standard") assert.equal(real, n - 1, `standard ${n} matches`);
    if (method === "rolling") {
      const byes = ms.filter((m) => m.status === "bye").map((m) => m.side_a);
      assert.equal(new Set(byes).size, byes.length, `rolling ${n}: nobody gets two byes`);
      assert.ok(real === n - 1 || real === n, `rolling ${n} matches ${real}`); // +1 when the last three play a round robin
    }
    if (method === "lucky_loser") assert.equal(ms.filter((m) => m.status === "bye").length, n % 2 && n > 2 ? 1 : 0, `lucky ${n}: only round 1 may have a bye`);
    if (method === "groups") assert.equal(ms.filter((m) => m.stage === "group").length, p.matches - (groupConfigs(n)[0].knockout - 1));
  }
}

// Fixed bracket: both players absent leaves the next opponent a bye
{
  const k = (no: number, a: string, b: string, winner: string | null): M => ({ id: String(no), stage: "knockout", round: 1, no, grp: null, side_a: a, side_b: b, winner, status: "done", score: null });
  const ms = [k(1, "a", "b", "a"), k(2, "c", "d", null), k(3, "e", "f", "f"), k(4, "g", "h", "g")];
  const next = nextStep("standard", o, ms, "x");
  assert.deepEqual(next.kind === "round" && next.pairs, [{ a: "a", b: null }, { a: "f", b: "g" }]);
}

// Scores, standings, re-pairing
assert.deepEqual(parseScore("21-15, 19–21, 21:18"), { sets: [[21, 15], [19, 21], [21, 18]], a: 61, b: 54 });
assert.equal(parseScore("W/O"), null);
{
  const ms: M[] = [
    { id: "1", stage: "group", round: 1, no: 1, grp: "A", side_a: "x", side_b: "y", winner: "x", status: "done", score: "21-10" },
    { id: "2", stage: "group", round: 2, no: 2, grp: "A", side_a: "y", side_b: "z", winner: "y", status: "done", score: "21-19" },
    { id: "3", stage: "group", round: 3, no: 3, grp: "A", side_a: "z", side_b: "x", winner: "z", status: "done", score: "21-19" },
  ];
  assert.deepEqual(standings(ms, ["x", "y", "z"]).map((r) => r.id), ["x", "z", "y"]); // all 2 pts; diff +9, 0, -9
}
{
  const r = rePair(["a", "d", "f"], "R");
  assert.equal(r.pairs.length, 1);
  assert.ok(r.walkover);
}
console.log("rounds ok");

// Committee overrides
{
  const k = (no: number, a: string, b: string | null, winner: string | null, status: M["status"] = "done"): M => ({ id: String(no), stage: "knockout", round: 2, no, grp: null, side_a: a, side_b: b, winner, status, score: null });
  const ms = [k(1, "a", "b", "a"), k(2, "c", null, "c", "bye"), k(3, "d", "e", "e")];
  const adv = advancers(ms)!;
  assert.deepEqual(adv.through, ["a", "c", "e"]);
  assert.deepEqual(adv.out, ["b", "d"]);
  assert.ok(validPairs([{ a: "a", b: "c" }, { a: "e", b: null }], ["a", "c", "e"]));
  assert.ok(!validPairs([{ a: "a", b: "c" }], ["a", "c", "e"]), "someone left out");
  assert.ok(!validPairs([{ a: "a", b: "a" }, { a: "e", b: null }], ["a", "c", "e"]), "someone twice");
  const unstarted = rearrangeable([k(1, "a", "b", null, "scheduled"), k(2, "c", null, "c", "bye"), k(3, "d", null, "d", "bye"), k(4, "e", "f", "f")]);
  assert.deepEqual(unstarted.map((m) => m.no), [1, 2, 3]);
}
console.log("overrides ok");
