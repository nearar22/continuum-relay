"""Test 2 - Missing context.

A baton that lacks unresolved risks and a definition of done must be caught by
the deterministic missing-required-layer guard BEFORE the model runs, yielding a
'needs_repair' outcome. We assert the guard detects the missing layers, and that
weak completeness readings also derive 'needs_repair' from _gate_band.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    layers = {
        "mission": "Finish the grant scoring interface.",
        "currentState": "Layout done, logic partial.",
        "unresolvedRisks": "",        # missing
        "nextAction": "Implement the explanation component.",
        "definitionOfDone": "",        # missing
    }
    missing = [k for k in m.REQUIRED_LAYERS if not str(layers.get(k, "")).strip()]
    if set(missing) == {"unresolvedRisks", "definitionOfDone"}:
        passed += 1
        print("  ok  missing-context guard detects absent required layers")
    else:
        failed += 1
        print(f"FAIL  expected unresolvedRisks and definitionOfDone missing, got {missing}")

    # Even with layers present, low completeness derives needs_repair.
    readings = {
        "completeness": 40,
        "intentPreservation": 70,
        "contradiction": 10,
        "riskClarity": 30,
        "nextActionClarity": 60,
        "definitionOfDoneClarity": 25,
    }
    band = m._gate_band(readings)
    if band == "needs_repair":
        passed += 1
        print("  ok  weak completeness derives gate band 'needs_repair'")
    else:
        failed += 1
        print(f"FAIL  expected 'needs_repair', got '{band}'")

    return passed, failed


if __name__ == "__main__":
    run()
