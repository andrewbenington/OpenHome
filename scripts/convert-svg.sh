#!/bin/bash

svg_path=$1
png_path=$2

magick -background none "$svg_path" -resize 10% "$png_path"