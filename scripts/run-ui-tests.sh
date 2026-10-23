#!/bin/bash

if [ ! -f ./target/release/OpenHome ]; then
  echo "test binary not found, building..."
  pnpm ui-test-build || exit 1
fi

dummysaves="{\"$(pwd)/ui-tests/ui-tests-data-dir/test_saves/crystal-shinies.sav\":{\"filePath\":{\"dir\":\"$(pwd)/ui-tests/ui-tests-data-dir/test_saves\",\"ext\":\"\",\"name\":\"crystal-shinies.sav\",\"raw\":\"$(pwd)/ui-tests/ui-tests-data-dir/test_saves/crystal-shinies.sav\",\"separator\":\"/\"},\"game\":41,\"lastModified\":null,\"lastOpened\":1792552616000,\"pluginIdentifier\":null,\"trainerID\":\"24608\",\"trainerName\":\"Lexi\",\"valid\":true}}"

echo $dummysaves > ./ui-tests/ui-tests-data-dir/storage/recent_saves.json

if [ "$(uname)" = "Linux" ] && [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
  xvfb-run -a pnpm wdio
else
  pnpm wdio
fi

echo $dummysaves > ./ui-tests/ui-tests-data-dir/storage/recent_saves.json