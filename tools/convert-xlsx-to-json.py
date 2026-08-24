#!/usr/bin/env python3
"""Converts raw EV dataset Excel files (.xlsx) into clean, camelCase JSON artifacts.

Usage:
    $ python3 convert-xlsx-to-json.py path/to/dataset.xlsx
    $ python3 convert-xlsx-to-json.py path/to/dataset.xlsx -o path/to/output.json

Requirements:
    - pandas
    - openpyxl

Install Required Dependencies:
    $ python3 -m pip install --user -r requirements.txt
"""

import argparse
from pathlib import Path
import pandas as pd

def clean_and_normalize_camel_case(name: str) -> str:
    """Cleans up any inconsistent spacing, casing, or lingering characters
    from raw input, and remaps outdated attribute names.
    """
    if not isinstance(name, str) or pd.isna(name):
        return ""

    sanitized: str = name.strip()

    if sanitized:
        sanitized = sanitized[0].lower() + sanitized[1:]

    return sanitized


def process_excel_to_json(input_path: Path, output_path: Path) -> None:
    """Reads the Excel file, normalizes headers, and writes a formatted JSON file."""
    df: pd.DataFrame = pd.read_excel(input_path, skiprows=[0])

    df.columns = [clean_and_normalize_camel_case(col) for col in df.columns]

    df = df.loc[:, df.columns != ""]

    df.to_json(output_path, orient="records", indent=4)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "excel_file",
        type=Path,
        help="Path to the input Excel (.xlsx) file.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Optional path/filename for output JSON. Defaults to the input filename with a .json extension.",
    )

    args = parser.parse_args()

    input_file: Path = args.excel_file.resolve()

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")

    output_file: Path = (
        args.output.resolve()
        if args.output
        else input_file.with_suffix(".json")
    )

    process_excel_to_json(input_file, output_file)


if __name__ == "__main__":
    main()