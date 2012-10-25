# Script and Instructions for updating the chrome extension
#
# Run this script from the directoru that it's in to create
# the zip file that we need to upload to the chrome web store
#
# Before you upload, you'll need to bump the version in the
# src/manifest.json file to something higher than what's
# already in production.
#
# After creating the zip file, upload it to the chrome web
# store by logging in as admin@findings.com and editing the
# application's data through the web interface.

zip -r findings-chrome-extension.zip src
