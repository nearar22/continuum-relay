"""Tiny zero-dependency runner so the six contract tests run with plain python,
no pytest required:  python tests/runner.py
Each test module exposes run() and returns (passed, failed) counts.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

MODULES = [
    "test_complete_handoff",
    "test_missing_context",
    "test_contradictory_summary",
    "test_receiver_misunderstanding",
    "test_fake_completion",
    "test_repair_loop",
]


def main():
    import importlib

    total_pass = 0
    total_fail = 0
    for name in MODULES:
        mod = importlib.import_module(name)
        p, f = mod.run()
        total_pass += p
        total_fail += f
    print(f"\nContinuum Relay contract tests: {total_pass} passed, {total_fail} failed")
    sys.exit(0 if total_fail == 0 else 1)


if __name__ == "__main__":
    main()
