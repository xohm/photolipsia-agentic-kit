import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textStats } from '../src/stats.js';

const WPM = 200;

function expectedReadingMinutes(words) {
  const raw = words / WPM;
  return raw === 0 ? 0 : Math.max(Math.round(raw * 10) / 10, 0.1);
}

test('empty text yields zero counts', () => {
  const s = textStats('');
  assert.deepEqual(s, {
    words: 0,
    characters: 0,
    sentences: 0,
    readingMinutes: 0,
  });
});

test('whitespace-only text yields zero counts', () => {
  const s = textStats('   \n\t  ');
  assert.deepEqual(s, {
    words: 0,
    characters: 0,
    sentences: 0,
    readingMinutes: 0,
  });
});

test('single word counts', () => {
  const s = textStats('hello');
  assert.equal(s.words, 1);
  assert.equal(s.characters, 5);
  assert.equal(s.sentences, 1);
  assert.equal(s.readingMinutes, expectedReadingMinutes(1));
});

test('multiple words separated by spaces and newlines', () => {
  const text = 'one two\tthree\nfour';
  const s = textStats(text);
  assert.equal(s.words, 4);
  assert.equal(s.characters, text.trim().length);
  assert.equal(s.sentences, 1);
  assert.equal(s.readingMinutes, expectedReadingMinutes(4));
});

test('sentences split on period, question and exclamation marks', () => {
  const s = textStats('First one. Second one! Third one? Fourth without terminal punctuation');
  assert.equal(s.words, 10);
  assert.equal(s.sentences, 4);
});

test('punctuation-only text is not a word', () => {
  const s = textStats('... !!! ???');
  assert.equal(s.words, 0);
  assert.equal(s.sentences, 0);
});

test('hyphenated and apostrophe words count as one word', () => {
  const s = textStats('state-of-the-art, don\'t');
  assert.equal(s.words, 2);
});

test('multiple spaces do not create empty words', () => {
  const s = textStats('hello   world');
  assert.equal(s.words, 2);
  assert.equal(s.characters, 13);
});

test('abbreviation with multiple dots counts as one sentence', () => {
  const s = textStats('Wait for it... then go!');
  assert.equal(s.words, 5);
  assert.equal(s.sentences, 2);
});

test('reading time is words divided by 200 wpm', () => {
  const s = textStats(Array(400).fill('word').join(' '));
  assert.equal(s.words, 400);
  assert.equal(s.readingMinutes, 2);
});

test('reading time is rounded to one decimal', () => {
  const s = textStats(Array(300).fill('word').join(' '));
  assert.equal(s.words, 300);
  assert.equal(s.readingMinutes, 1.5);
});

test('reading time never below 0.1 minutes for non-empty text', () => {
  const s = textStats('tiny');
  assert.equal(s.words, 1);
  assert.equal(s.readingMinutes, 0.1);
});
