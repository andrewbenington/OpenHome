#!/usr/bin/env bash
# Usage: ./diff_dirs.sh dir1 dir2
# Finds files in dir1 that have no same-named file in dir2

dir1="$1"
dir2="$2"

comm -23 \
  <(find "$dir1" -maxdepth 1 -type f -exec basename {} \; | sort) \
  <(find "$dir2" -maxdepth 1 -type f -exec basename {} \; | sort)