#!/usr/bin/env python3

# Usage: ./vdacdefs2json.py ~/Steam/steamapps/common/Underlords/game/dac/scripts/units.vdacdefs_c ./units.json

# Dependencies:
# - `pip install vdf`
# - VRF decompiler (vrf_decompiler) in path necessary as well, see https://github.com/SteamDatabase/ValveResourceFormat

import sys
import subprocess
import json

import vdf
# import steam

input_file_path = sys.argv[1]
output_file_path = sys.argv[2]

subprocess.call(
    ["vrf_decompiler", "-i", input_file_path, "-o", "/tmp/vdacdefs"])

with open("/tmp/vdacdefs") as vdacdefs_file:
    # Cleanup the vrf file to a useable format for the vdf python package
    vdacdefs_file_content = ""

    # And whenever a "[" appears, it has to be replaced with an "{" (likewise "]" --> "}")
    # --> Yet whenever and array has been detected, the following lines need to be prepended with an index
    vdacdefs_file_lines = []

    # As arrays can be nested, a height index and a list of nested indexes will be used
    array_height = -1
    array_nested_index = [0]

    for line in vdacdefs_file.readlines():
        # Remove every =
        line = line.replace("=", "")
        # As the first and last "{", "}" will be removed
        # We need to intend every line back by one tab
        line = line.replace("\t", "", 1)

        # Strip the line of indentation for cleaner replaces
        stripped_line = line.strip()

        if stripped_line.startswith("["):
            if array_height > -1:
                # If it's a nested array, we need to prepend the index of the previous array and a line breaks
                line = line.replace(stripped_line, str(
                    array_nested_index[array_height]) + "\n" + stripped_line)

            line = line.replace("[", "{")

            array_height += 1

            # If the nested level has not been reached yet, initiate the array
            if array_height > len(array_nested_index) - 1:
                array_nested_index.insert(array_height, 0)
        elif stripped_line.startswith("]"):
            array_nested_index[array_height] = 0
            array_height -= 1

            line = line.replace("]", "}")
        elif array_height > -1 and len(stripped_line):
            # If we are inside an array, prepend the array index
            line = line.replace(stripped_line, str(
                array_nested_index[array_height]) + " " + stripped_line)
            array_nested_index[array_height] += 1

        # Append the cleaned line to the line array
        vdacdefs_file_lines.append(line)

    # Skip first and last line, as those are just opening brackets
    vdacdefs_file_lines = vdacdefs_file_lines[1:]
    vdacdefs_file_lines = vdacdefs_file_lines[:-1]

    # Join all the lines to a string
    vdacdefs_file_content = "".join(vdacdefs_file_lines)

    # Write the working lines to a debug file
    with open("/tmp/vdacdefs_debug", "w") as debug_file:
        debug_file.write(vdacdefs_file_content)

    # Parse Valve's KeyValue format
    dacdefs = vdf.loads(vdacdefs_file_content)

# Dump the parsed dict to a JSON file
with open(output_file_path, "w") as json_file:
    json.dump(dacdefs, json_file, indent=2)

# Cleanup
subprocess.call(["rm", "/tmp/vdacdefs"])
subprocess.call(["rm", "/tmp/vdacdefs_debug"])

print(f"Successfully converted {input_file_path} to {output_file_path}")
