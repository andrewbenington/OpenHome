#!/usr/bin/sh

docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 ghcr.io/steamdeckhomebrew/holo-toolchain-rust:latest \
 bash
