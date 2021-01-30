#!/bin/bash
set -e

##
## Purge jsdelivr CDN cache
## (to runon new release after commit)
##

npx req https://purge.jsdelivr.net/gh/pierreavn/websheetjs/dist/websheet.js
npx req https://purge.jsdelivr.net/gh/pierreavn/websheetjs/dist/websheet.min.js