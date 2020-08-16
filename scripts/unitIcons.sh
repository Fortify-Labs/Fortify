#!/usr/bin/env bash

# Usage: ./unitIcons.sh [...]/Steam/steamapps/common/Underlords/game/dac/pak01_dir.vpk ./assets

vrf_decompiler -i "$1" -d -f "panorama\\images\\heroes" -o "$2"
