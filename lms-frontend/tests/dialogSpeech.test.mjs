import test from "node:test";
import assert from "node:assert/strict";
import { characterVoiceGender, createDialogPlayer, selectDialogVoice } from "../src/utils/dialogSpeech.js";
import { parseDialogContent, serializeDialogConfig } from "../src/utils/languageInteractiveBlocks.js";

const voices = [
    { name: "Daniel", lang: "en-GB", voiceURI: "daniel", default: true },
    { name: "Samantha", lang: "en-US", voiceURI: "samantha" },
    { name: "Serena", lang: "en-GB", voiceURI: "serena" },
    { name: "Zosia", lang: "pl-PL", voiceURI: "zosia" }
];
const characters = [{ id: "mia", name: "Mia", avatar: "👩" }, { id: "alex", name: "Alex", avatar: "👨" }];
const turns = Array.from({ length: 60 }, (_, index) => ({ speakerId: index % 2 ? "alex" : "mia", text: `Line ${index + 1}` }));

function fixture(timeout = 4000) {
    const utterances = [], states = [];
    const synthesis = { getVoices: () => voices, cancel() {}, speak(utterance) { utterances.push(utterance); } };
    class Utterance { constructor(text) { this.text = text; } }
    const player = createDialogPlayer({ synthesis, Utterance, onState: (state) => states.push(state), startTimeout: timeout });
    return { player, synthesis, utterances, states };
}

test("Mia gets an available female voice, Alex gets a male voice", () => {
    assert.equal(selectDialogVoice(voices, "en-GB", characters[0]).name, "Serena");
    assert.equal(selectDialogVoice(voices, "en-GB", characters[1]).name, "Daniel");
    assert.equal(selectDialogVoice(voices.slice(0, 2), "en-GB", characters[0]).name, "Samantha");
    assert.equal(selectDialogVoice(voices, "fr-FR", characters[0]), null);
});

test("prefers natural voices and never substitutes a male or novelty voice for Mia", () => {
    const natural = { name: "Microsoft Sonia Online (Natural)", lang: "en-GB", voiceURI: "sonia" };
    assert.equal(selectDialogVoice([...voices, natural], "en-GB", characters[0]), natural);
    assert.equal(selectDialogVoice([{ name: "Zarvox", lang: "en-GB" }, voices[0]], "en-GB", characters[0]), null);
    assert.equal(characterVoiceGender({ side: "left", voiceGender: "neutral" }), "female");
    assert.equal(characterVoiceGender({ side: "right" }), "male");
});

test("gender preference survives config editing and legacy Mia still works", () => {
    const config = parseDialogContent(serializeDialogConfig({ characters: [{ ...characters[0], voiceGender: "male" }], turns: [] }));
    assert.equal(characterVoiceGender(config.characters[0]), "male");
    assert.equal(characterVoiceGender(characters[0]), "female");
});

test("plays all 60 turns sequentially with the right voices", () => {
    const { player, utterances, states } = fixture();
    player.play(turns, characters, "en-GB");
    for (let index = 0; index < 60; index += 1) {
        assert.equal(utterances.length, index + 1);
        const utterance = utterances[index];
        assert.equal(utterance.text, turns[index].text);
        assert.equal(utterance.voice.name, index % 2 ? "Daniel" : "Serena");
        assert.equal(utterance.rate, 1);
        utterance.onstart();
        utterance.onend();
    }
    assert.deepEqual(states.at(-1), { status: "done", index: -1 });
});

test("stop/unmount prevents a delayed end event from starting the next turn", () => {
    const { player, utterances } = fixture();
    player.play(turns, characters, "en-GB");
    const delayedEnd = utterances[0].onend;
    player.stop(false);
    delayedEnd();
    assert.equal(utterances.length, 1);
});

test("individual bubble stops the old queue and reads only that bubble", () => {
    const { player, utterances, states } = fixture();
    player.play(turns, characters, "en-GB");
    const oldEnd = utterances[0].onend;
    player.play(turns, characters, "en-GB", 5);
    oldEnd();
    utterances[1].onstart();
    utterances[1].onend();
    assert.equal(utterances.length, 2);
    assert.equal(utterances[1].text, "Line 6");
    assert.equal(states.at(-1).status, "done");
});

test("blocked autoplay can be retried by a manual click", () => {
    const { player, utterances, states } = fixture();
    player.play(turns, characters, "en-GB");
    utterances[0].onerror({ error: "not-allowed" });
    assert.equal(states.at(-1).status, "blocked");
    player.play(turns, characters, "en-GB");
    utterances[1].onstart();
    assert.equal(states.at(-1).status, "playing");
    player.stop();
});

test("silent autoplay failure times out without queuing more speech", async () => {
    const { player, states, utterances } = fixture(5);
    player.play(turns, characters, "en-GB");
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(states.at(-1).status, "blocked");
    assert.equal(utterances.length, 1);
});

test("missing voices and missing speech API give a visible fallback", () => {
    const { player, synthesis, states } = fixture();
    synthesis.getVoices = () => [];
    player.play(turns, characters, "en-GB");
    assert.equal(states.at(-1).status, "no-voice");
    const unsupported = createDialogPlayer({ onState: (state) => states.push(state) });
    unsupported.play(turns, characters, "en-GB");
    assert.equal(states.at(-1).status, "unsupported");
});
