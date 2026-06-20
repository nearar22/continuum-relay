"""Test 3 - Contradictory summary.

When the baton contains incompatible instructions (a protected constraint that
forbids publishing private notes while the next action publishes them), the
model reports a high contradiction reading and the contract's _gate_band must
hard-block: contradiction >= 60 forces 'blocked' regardless of other scores.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    # High contradiction must force 'blocked' even with otherwise strong scores.
    readings = {
        "completeness": 88,
        "intentPreservation": 85,
        "contradiction": 75,
        "riskClarity": 80,
        "nextActionClarity": 82,
        "definitionOfDoneClarity": 80,
    }
    band = m._gate_band(readings)
    if band == "blocked":
        passed += 1
        print("  ok  a strong contradiction forces gate band 'blocked'")
    else:
        failed += 1
        print(f"FAIL  expected 'blocked', got '{band}'")

    # A borderline contradiction (below threshold) does not block on its own.
    readings2 = dict(readings)
    readings2["contradiction"] = 20
    band2 = m._gate_band(readings2)
    if band2 != "blocked":
        passed += 1
        print("  ok  a low contradiction does not force a block")
    else:
        failed += 1
        print("FAIL  low contradiction should not block")

    return passed, failed


if __name__ == "__main__":
    run()
