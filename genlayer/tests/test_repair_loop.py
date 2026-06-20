"""Test 6 - Repair loop.

A baton first fails the gate (missing or weak context derives 'needs_repair'),
then the sender repairs the missing layers and the second evaluation derives
'open'. We assert both ends of the loop: the weak readings derive needs_repair,
and the strengthened readings derive open.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    before = {
        "completeness": 44,
        "intentPreservation": 60,
        "contradiction": 10,
        "riskClarity": 35,
        "nextActionClarity": 58,
        "definitionOfDoneClarity": 30,
    }
    band_before = m._gate_band(before)
    if band_before == "needs_repair":
        passed += 1
        print("  ok  pre-repair readings derive 'needs_repair'")
    else:
        failed += 1
        print(f"FAIL  expected 'needs_repair' before repair, got '{band_before}'")

    # After repair: completeness and the clarity readings rise.
    after = {
        "completeness": 84,
        "intentPreservation": 78,
        "contradiction": 8,
        "riskClarity": 80,
        "nextActionClarity": 82,
        "definitionOfDoneClarity": 80,
    }
    band_after = m._gate_band(after)
    if band_after == "open":
        passed += 1
        print("  ok  post-repair readings derive 'open'")
    else:
        failed += 1
        print(f"FAIL  expected 'open' after repair, got '{band_after}'")

    return passed, failed


if __name__ == "__main__":
    run()
