"""Test 4 - Receiver misunderstanding.

The receiver restates the handoff but violates a protected constraint (plans to
publish notes the baton said must stay private). The contract's _mirror_band
must return 'critical_omission' whenever constraintViolated is set, no matter how
high the surface alignment looks, so acceptance is blocked.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    # Confident-sounding but constraint-violating restatement.
    readings = {"alignment": 82, "criticalOmission": 10, "constraintViolated": 100}
    band = m._mirror_band(readings)
    if band == "critical_omission":
        passed += 1
        print("  ok  a violated protected constraint yields 'critical_omission'")
    else:
        failed += 1
        print(f"FAIL  expected 'critical_omission', got '{band}'")

    # A faithful restatement with high alignment is a match.
    readings_ok = {"alignment": 82, "criticalOmission": 5, "constraintViolated": 0}
    band_ok = m._mirror_band(readings_ok)
    if band_ok == "match":
        passed += 1
        print("  ok  a faithful restatement yields 'match'")
    else:
        failed += 1
        print(f"FAIL  expected 'match', got '{band_ok}'")

    # A big omission (no constraint issue) is still critical.
    readings_omit = {"alignment": 70, "criticalOmission": 70, "constraintViolated": 0}
    if m._mirror_band(readings_omit) == "critical_omission":
        passed += 1
        print("  ok  a large critical omission yields 'critical_omission'")
    else:
        failed += 1
        print("FAIL  large omission should be critical")

    return passed, failed


if __name__ == "__main__":
    run()
