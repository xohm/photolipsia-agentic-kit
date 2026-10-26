import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSplatFile, validateSplatName, resolveDetail, loadModeFor, TEST_SPLAT, SUPPORTED_FORMATS } from '../src/splat-choice.js';

test('empty config and no URL parameter load the test splat', () => {
  assert.deepEqual(resolveSplatFile(''), { name: TEST_SPLAT, url: '/splats/test.ply' });
  assert.deepEqual(resolveSplatFile('', ''), { name: TEST_SPLAT, url: '/splats/test.ply' });
});

test('a configured name is used as-is', () => {
  assert.deepEqual(resolveSplatFile('my-scan.ply'), { name: 'my-scan.ply', url: '/splats/my-scan.ply' });
});

test('?file= overrides the config', () => {
  assert.deepEqual(resolveSplatFile('my-scan.ply', '?file=other.spz'), {
    name: 'other.spz',
    url: '/splats/other.spz',
  });
});

test('?file= with an empty value means the test splat', () => {
  assert.deepEqual(resolveSplatFile('my-scan.ply', '?file='), { name: TEST_SPLAT, url: '/splats/test.ply' });
});

test('every supported format resolves', () => {
  for (const format of SUPPORTED_FORMATS) {
    const result = resolveSplatFile(`scan.${format}`);
    assert.equal(result.name, `scan.${format}`);
  }
});

test('extensions are case-insensitive', () => {
  assert.deepEqual(resolveSplatFile('Scan.PLY'), { name: 'Scan.PLY', url: '/splats/Scan.PLY' });
});

test('unsupported formats are rejected with the list of formats', () => {
  assert.throws(() => resolveSplatFile('photo.jpg'), /Supported formats: \.ply, \.spz/);
  assert.throws(() => resolveSplatFile('', '?file=photo.jpg'), /photo\.jpg/);
});

test('a name without an extension is rejected', () => {
  assert.throws(() => resolveSplatFile('nosplat'), /Unsupported splat format/);
});

test('paths are rejected', () => {
  assert.throws(() => resolveSplatFile('../secret.ply'), /use just the name/);
  assert.throws(() => resolveSplatFile('', '?file=a/b.ply'), /use just the name/);
});

test('validateSplatName accepts every supported format', () => {
  for (const format of SUPPORTED_FORMATS) {
    assert.deepEqual(validateSplatName(`drop-me.${format}`), { name: `drop-me.${format}`, extension: format });
  }
});

test('validateSplatName rejects non-splat files with the format list', () => {
  assert.throws(() => validateSplatName('photo.jpg'), /photo\.jpg/);
  assert.throws(() => validateSplatName('photo.jpg'), /Supported formats: \.ply/);
});

test('validateSplatName rejects files without an extension', () => {
  assert.throws(() => validateSplatName('nosplat'), /Unsupported splat format/);
});

test('resolveDetail defaults to the config value', () => {
  assert.equal(resolveDetail('', 2), 2);
  assert.equal(resolveDetail('?file=a.ply', 2), 2);
});

test('?detail= overrides the config detail', () => {
  assert.equal(resolveDetail('?detail=3', 2), 3);
  assert.equal(resolveDetail('?detail=0.5', 2), 0.5);
});

test('?detail= rejects invalid values', () => {
  assert.throws(() => resolveDetail('?detail=abc', 2), /positive number/);
  assert.throws(() => resolveDetail('?detail=0', 2), /positive number/);
  assert.throws(() => resolveDetail('?detail=-1', 2), /positive number/);
});

test('loadModeFor streams .rad and applies the lod setting otherwise', () => {
  assert.deepEqual(loadModeFor('scan.rad', true), { paged: true, lod: false });
  assert.deepEqual(loadModeFor('scan.rad', false), { paged: true, lod: false });
  assert.deepEqual(loadModeFor('scan.ply', true), { paged: false, lod: true });
  assert.deepEqual(loadModeFor('scan.ply', false), { paged: false, lod: false });
  assert.deepEqual(loadModeFor('scan.SPLAT', true), { paged: false, lod: true });
});
