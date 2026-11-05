const fs = require('node:fs/promises');
const path = require('node:path');

async function cleanHtml(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await cleanHtml(filename);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const content = await fs.readFile(filename);
      if (content.includes(0)) {
        await fs.writeFile(filename, content.filter(byte => byte !== 0));
      }
    }
  }
}

module.exports = function stripSsrNullCharacters() {
  return {
    name: 'strip-ssr-null-characters',
    // React 18 SSR can insert NUL bytes into CJK HTML: docusaurus#9985.
    async postBuild({ outDir }) {
      await cleanHtml(outDir);
    },
  };
};
