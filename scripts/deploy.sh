#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages serves from it).
# Usage: npm run deploy
set -euo pipefail

REMOTE_URL="$(git remote get-url origin)"
SHA="$(git rev-parse --short HEAD)"

npm run build

cd dist
touch .nojekyll            # serve files as-is, no Jekyll processing
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" \
  commit -qm "Deploy ${SHA}"
git push -qf "$REMOTE_URL" gh-pages
rm -rf .git
echo "Deployed ${SHA} to gh-pages"
