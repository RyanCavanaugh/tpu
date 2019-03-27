// @ts-check
const path = require("path");
const fs = require("fs");
const pako = require("pako");

const { deflate, inflate } = pako;

const trainingRoot = `D:/github/TypeScript/tests/cases/compiler`;
const MAX_STR_LEN = 22; // ??
const MIN_STR_LEN = 3; // ???

const sample = fs.readFileSync("samples/1.ts", { encoding: "utf-8" }).replace(/\r\n/g, "\r");

console.log("Training");
const counter = {};
for (const file of fs.readdirSync(trainingRoot)) {
    const content = fs.readFileSync(path.join(trainingRoot, file), { encoding: "utf-8" });
    // Skip "large" tests as they're often degenerate repetitions
    if (content.length > 800) continue;
    for (let i = 0; i < content.length; i++) {
        for (let len = MIN_STR_LEN; len <= MAX_STR_LEN; len++) {
            if (len + i >= content.length) break;
            const s = content.substr(i, len);
            counter[s] = (counter[s] || 0) + 1;
        }
    }
}

let candidates = Object.keys(counter).map(k => {
    return {
        str: k,
        len: k.length,
        hits: counter[k],
        weight: k.length * counter[k]
    };
});
console.log("Collected a total of " + candidates.length + " candidates");
candidates = candidates.filter(c => c.hits > 100);
console.log("Kept " + candidates.length);

candidates.sort((a, b) => b.weight - a.weight);
for (let i = 0; i < 100; i++) {
    console.log("Top candidate is " + JSON.stringify(candidates[i]));
}

let dictionary = "";
let lastLength = deflateWithDict(sample, dictionary).length;
while (dictionary.length < 1024) {
    console.log("Evaluating candidates for best improvement");
    let bestCandidateScore = -1;
    let bestCandidate = null;
    for (let i = 0; i < candidates.length; i++) {
        let score = lastLength - deflateWithDict(sample, candidates[i].str + dictionary).length;
        if (score >= bestCandidateScore) {
            if (bestCandidate === null || (candidates[i].len > bestCandidate.len)) {
                bestCandidate = candidates[i];
            }
            bestCandidateScore = score;
        }
    }
    console.log("Picked " + JSON.stringify(bestCandidate.str) + " at a score of " + bestCandidateScore);
    dictionary = bestCandidate.str + dictionary;

    console.log("Culling duplicative candidates");
    candidates = candidates.filter(c => dictionary.indexOf(c.str) < 0);

    const newLength = deflateWithDict(sample, dictionary).length;
    console.log("New length is " + newLength + " (was " + lastLength + ")");
    lastLength = newLength;
}

/*
runTest("Without", sample, undefined);
runTest("With", sample, "type interface class ;\r        ");
runTest("With2", sample, "\rfunction string number boolean typeof \rlet\rconst interface <T> = \r// extends keyof type interface class ;\r        ");
*/

function deflateWithDict(content, dictionary) {
    const result = deflate(content, {
        level: 9,
        windowBits: 15,
        memLevel: 9,
        dictionary
    });

    const b64 = Buffer.from(result.buffer);
    return b64;
}
