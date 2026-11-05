const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const plugin = require('../plugins/strip-ssr-null-characters');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-ssr-null-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('cleans HTML anchors and preserves UTF-8 and escaped code', async t => {
  const root = await fixture(t);
  const filename = path.join(root, 'index.html');
  const expected = '<a href="#测试">测试</a><h2 id="测试">测试</h2><code>\\0</code>';
  await fs.writeFile(filename, expected.replace('href="#', 'href="#\0'));
  await plugin().postBuild({ outDir: root });
  assert.equal(await fs.readFile(filename, 'utf8'), expected);
});

test('handles nested locale HTML without rewriting assets or following symlinks', async t => {
  const root = await fixture(t);
  const locale = path.join(root, 'en');
  await fs.mkdir(locale);
  await fs.writeFile(path.join(locale, 'index.html'), '<h1>English\0</h1>');
  const asset = path.join(root, 'asset.png');
  const bytes = Buffer.from([0, 1, 2, 0, 255]);
  await fs.writeFile(asset, bytes);
  const linkedHtml = path.join(root, 'external.txt');
  await fs.writeFile(linkedHtml, 'external\0content');
  await fs.symlink(linkedHtml, path.join(locale, 'linked.html'));
  await plugin().postBuild({ outDir: root });
  assert.equal(await fs.readFile(path.join(locale, 'index.html'), 'utf8'), '<h1>English</h1>');
  assert.deepEqual(await fs.readFile(asset), bytes);
  assert.equal(await fs.readFile(linkedHtml, 'utf8'), 'external\0content');
});

test('leaves clean HTML unchanged on repeated builds', async t => {
  const root = await fixture(t);
  const filename = path.join(root, 'index.html');
  const content = Buffer.from('<h1>Ready &amp; Safe</h1>\n');
  await fs.writeFile(filename, content);
  const before = await fs.stat(filename);
  await plugin().postBuild({ outDir: root });
  await plugin().postBuild({ outDir: root });
  assert.deepEqual(await fs.readFile(filename), content);
  assert.equal((await fs.stat(filename)).mtimeMs, before.mtimeMs);
});
