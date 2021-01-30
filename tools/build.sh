#!/bin/bash
set -e

##
## Build & Minify websheet.js library into dist/
##

# 1. Run tests to ensure everything still works
npm test

# 2. Build Typescript into Javascript
echo "* Bundling..."
npx tsc

# 3. Builde multiple JS files into bundled one
npx browserify --standalone websheet -o build_tmp/websheet.js build_tmp/index.js
cp build_tmp/websheet.js dist/websheet.js

# 4. Minify & Compress it
echo "* Minifying..."
npx uglifyjs dist/websheet.js --compress --mangle eval -o dist/websheet.min.js

# 5. Determine minified bundle size
MINIFIED_SIZE=$(ls -lh dist/websheet.min.js | awk -F " " {'print $5'})

echo "Websheet.js built & minified successfully! ($MINIFIED_SIZE)"