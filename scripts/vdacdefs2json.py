#!/usr/bin/env python3

# Usage: ./vdacdefs2json.py [...]/Steam/steamapps/common/Underlords/game/dac/scripts/units.vdacdefs_c ./units.json

# Dependencies:
# - `pip install vdf`
# - VRF decompiler (vrf_decompiler) in path necessary as well, see https://github.com/SteamDatabase/ValveResourceFormat

from typing import Union

import sys
import subprocess
import json

import vdf

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
    array_object_stack = []

    for line in vdacdefs_file.readlines():
        # Remove every =
        line = line.replace("=", "")
        # As the first and last "{", "}" will be removed
        # We need to intend every line back by one tab
        line = line.replace("\t", "", 1)

        # Strip the line of indentation for cleaner replaces
        stripped_line = line.strip()

        if stripped_line.startswith("["):
            array_object_stack.append("arrayOpen")

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
            array_object_stack.pop()

            array_nested_index[array_height] = 0
            array_height -= 1

            line = line.replace("]", "}")
        elif array_height > -1 and len(stripped_line):
            # Inside an array, we might have different types
            # Such as string, numbers or even nested objects
            # Strings and numbers are fine, as they result in a 
            # one to one mapping
            # For objects, special handling is required
            if stripped_line.startswith("{"):
              array_object_stack.append("objectOpen")
              line = line.replace(stripped_line, str(
                  array_nested_index[array_height]) + "\n" + stripped_line)
              array_nested_index[array_height] += 1
            elif stripped_line.startswith("}"):
              array_object_stack.pop()

            type = array_object_stack[len(array_object_stack) - 1]

            if type is not None and type is not "objectOpen" and not stripped_line.startswith("}"):
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


# Convert every possible float and int value to the corresponding data type
def convert_entries_to_numerical(element: Union[str, dict, list, float, int]):
    if isinstance(element, str):
        try:
            # Try converting to float
            element = float(element)
            # if success, check if integer --> if true, convert to integer
            if element.is_integer():
                element = int(element)
        except:
            pass

        return element
    elif isinstance(element, dict):
        for key, entry in element.items():
            element[key] = convert_entries_to_numerical(entry)

        return element
    elif isinstance(element, list):
        return [convert_entries_to_numerical(entry) for entry in element]

def convert_indexed_lists_to_non_indexed(element: Union[str, dict, list, float, int]):
  if isinstance(element, dict):
    keys = list(element.keys())
    if len(keys) > 0 and keys[0] == "0":
      element = list(element.values())
    else:
      for key, entry in element.items():
        element[key] = convert_indexed_lists_to_non_indexed(entry)

      return element
  
  if isinstance(element, list):
    return [convert_indexed_lists_to_non_indexed(el) for el in element]
  
  return element

dacdefs = convert_entries_to_numerical(dacdefs)
dacdefs = convert_indexed_lists_to_non_indexed(dacdefs)

# Dump the parsed dict to a JSON file
with open(output_file_path, "w") as json_file:
    json.dump(dacdefs, json_file, indent=2)

# Cleanup
subprocess.call(["rm", "/tmp/vdacdefs"])
subprocess.call(["rm", "/tmp/vdacdefs_debug"])

print(f"Successfully converted {input_file_path} to {output_file_path}")
