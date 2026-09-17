"""
grid_format.py: arrange a list of ints into an aligned grid block

Usage:
    python grid_format.py input.txt --per-line 15 --indent 4 --sort --dedupe
    # or pipe in:
    cat input.txt | python grid_format.py --per-line 15
"""

import argparse
import re
import sys


def parse_numbers(text: str) -> list[int]:
    return [int(x) for x in re.findall(r"-?\d+", text)]


def build_grid(nums: list[int], per_line: int, indent: int, var_name: str) -> str:
    width = max(len(str(n)) for n in nums)
    pad = " " * indent

    lines = []
    for i in range(0, len(nums), per_line):
        chunk = nums[i : i + per_line]
        row = ", ".join(f"{n:>{width}}" for n in chunk)
        # trailing comma on every row except handle last row separately below
        lines.append(pad + row + ",")

    # remove trailing comma from the very last number
    if lines:
        lines[-1] = lines[-1].rstrip(",")

    body = "\n".join(lines)
    return f"# fmt: off\n{var_name} = [\n{body}\n]\n# fmt: on"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?", type=argparse.FileType("r"), default=sys.stdin)
    ap.add_argument("--per-line", type=int, default=15)
    ap.add_argument("--indent", type=int, default=4)
    ap.add_argument("--sort", action="store_true")
    ap.add_argument("--dedupe", action="store_true")
    ap.add_argument("--var-name", default="values")
    args = ap.parse_args()

    text = args.input.read()
    nums = parse_numbers(text)

    if args.dedupe:
        nums = list(dict.fromkeys(nums))  # preserves order while deduping
    if args.sort:
        nums = sorted(nums)

    print(build_grid(nums, args.per_line, args.indent, args.var_name))


if __name__ == "__main__":
    main()