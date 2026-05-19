const major = Number(process.versions.node.split('.')[0])

if (major < 18) {
  console.error(`
\x1b[31mNode.js ${process.version} is too old for this project.\x1b[0m

Vite requires Node 18 or newer.

Fix (nvm):
  nvm install 20
  nvm use
  npm run dev

Or set your default:
  nvm alias default 20
`)
  process.exit(1)
}
