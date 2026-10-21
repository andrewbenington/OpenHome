#!/bin/bash

echo "{\"$(pwd)/test-files/openhome/test_saves/crystal-shinies.sav\":{\"filePath\":{\"dir\":\"$(pwd)/test-files/openhome/test_saves\",\"ext\":\"\",\"name\":\"crystal-shinies.sav\",\"raw\":\"$(pwd)/test-files/openhome/test_saves/crystal-shinies.sav\",\"separator\":\"/\"},\"game\":41,\"lastModified\":null,\"lastOpened\":1792552616000,\"pluginIdentifier\":null,\"trainerID\":\"24608\",\"trainerName\":\"Lexi\",\"valid\":true}}" > ./test-files/openhome/storage/recent_saves.json

pnpm wdio