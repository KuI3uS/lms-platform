import test from 'node:test';
import assert from 'node:assert/strict';
import { speechText, pronunciationScore, letterPronunciation, recognitionTranscripts } from '../src/utils/pronunciation.js';
import { createLessonUtterance } from '../src/utils/browserSpeech.js';

test('letter playback uses names and respects language and Z dialect', () => {
    assert.equal(speechText('A', 'en-GB'), 'ay');
    assert.equal(speechText('E', 'en-GB'), 'ee');
    assert.equal(speechText('I', 'en-GB'), 'eye');
    assert.equal(speechText('P', 'en-GB'), 'pee');
    assert.equal(speechText('B', 'en-GB'), 'bee');
    assert.equal(speechText('Z', 'en-GB'), 'zed');
    assert.equal(speechText('Z', 'en-US'), 'zee');
    assert.equal(speechText('P', 'pl-PL'), 'P');
    assert.equal(speechText('Could you spell that?', 'en-GB'), 'Could you spell that?');
});

test('imported spellings remain separate letters even in dialogue questions', () => {
    assert.equal(speechText('A-L-E-X.', 'en-GB'), 'ay, ell, ee, ex');
    assert.equal(speechText('E-M-M-A', 'en-GB'), 'ee, em, em, ay');
    assert.equal(speechText('B-O-O-K', 'en-GB'), 'bee, oh, oh, kay');
    assert.equal(speechText('A L E X', 'en-GB'), 'ay, ell, ee, ex');
    assert.equal(speechText('Is that A-L-E-X?', 'en-GB'), 'Is that ay, ell, ee, ex?');
    assert.equal(speechText('a–l–e–x', 'en-GB'), 'ay, ell, ee, ex');
    for (const text of ['I am Alex.', 'A cup of tea', 'X-ray', 'Emma', 'BOOK']) {
        assert.equal(speechText(text, 'en-GB'), text);
    }
    assert.equal(speechText('A-L-E-X', 'pl-PL'), 'A-L-E-X');
});

test('blank legacy locale still produces letter names and learner hints', () => {
    assert.equal(speechText('A', ''), 'ay');
    assert.equal(speechText('P', null), 'pee');
    assert.equal(letterPronunciation('A', 'en-GB'), 'eɪ');
    assert.equal(letterPronunciation('Z', 'en-GB'), 'zed');
    assert.equal(letterPronunciation('Z', 'en-US'), 'ziː');
    assert.equal(letterPronunciation('Alex', 'en-GB'), null);
});

test('browser playback receives only the spoken name using the requested voice', () => {
    const british = { lang: 'en-GB', name: 'Serena' };
    const synthesis = { getVoices: () => [{ lang: 'pl-PL' }, { lang: 'en-US' }, british] };
    class Utterance { constructor(text) { this.text = text; } }
    const a = createLessonUtterance('A', 'en-GB', synthesis, Utterance);
    assert.equal(a.text, 'ay');
    assert.equal(a.lang, 'en-GB');
    assert.equal(a.voice, british);
    const spelling = createLessonUtterance('E-M-M-A', '', synthesis, Utterance);
    assert.equal(spelling.text, 'ee, em, em, ay');
    assert.equal(spelling.voice, british);
});

test('letter scoring accepts homophones without confusing B and P', () => {
    for (const text of ['A', 'ay', 'aye']) assert.equal(pronunciationScore('A', text, 'en-GB'), 100);
    for (const text of ['P', 'pee', 'pea']) assert.equal(pronunciationScore('P', text, 'en-GB'), 100);
    for (const text of ['B', 'bee', 'Couple', 'capital P']) assert.equal(pronunciationScore('P', text, 'en-GB'), 0);
    assert.equal(pronunciationScore('B', 'be', 'en-GB'), 100);
    assert.equal(pronunciationScore('B', 'pea', 'en-GB'), 0);
    assert.equal(pronunciationScore('P', '', 'en-GB'), 0);
});

test('spoken spelling accepts letter names, including multiword W, but rejects extras', () => {
    for (const text of ['A L E X', 'ay ell ee ex']) {
        assert.equal(pronunciationScore('A-L-E-X.', text, 'en-GB'), 100);
    }
    assert.equal(pronunciationScore('W-E-B', 'double you ee bee', 'en-GB'), 100);
    assert.equal(pronunciationScore('W-E-B', 'double u E B', 'en-GB'), 100);
    for (const text of ['ay ell ee', 'capital A L E X', 'ay ell ee why', 'double you ee pee']) {
        const target = text.startsWith('double') ? 'W-E-B' : 'A-L-E-X';
        assert.equal(pronunciationScore(target, text, 'en-GB'), 0);
    }
});

test('recognition keeps the whole spelling across segments and alternatives', () => {
    const results = [
        [{ transcript: 'a' }],
        [{ transcript: 'hell' }, { transcript: 'ell' }],
        [{ transcript: 'ee ex' }]
    ];
    const candidates = recognitionTranscripts(results);
    assert.deepEqual(candidates, ['a hell ee ex', 'a ell ee ex']);
    assert.equal(Math.max(...candidates.map((text) => pronunciationScore('A-L-E-X', text, 'en-GB'))), 100);
    assert.equal(recognitionTranscripts(Array.from({ length: 8 }, () => results[1])).length, 9);
    assert.deepEqual(recognitionTranscripts([]), []);
});

test('sentence scoring tolerates punctuation and retains partial scores', () => {
    assert.equal(pronunciationScore('Could you spell that?', 'Could you spell that'), 100);
    const partial = pronunciationScore('Could you spell that?', 'Could you say that');
    assert.ok(partial > 0 && partial < 100);
});
