"""Test 1 - Complete handoff.

A baton with mission, state, risks, constraints, next action, and definition of
done present should derive a gate band of 'open' once the model returns strong
readings. We feed the contract's own _gate_band the kind of readings a complete
handoff produces and assert the gate opens.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    # Strong readings: complete, intent preserved, no contradiction.
    readings = {
        "completeness": 86,
        "intentPreservation": 80,
        "contradiction": 8,
        "riskClarity": 82,
        "nextActionClarity": 84,
        "definitionOfDoneClarity": 80,
    }
    band = m._gate_band(readings)
    if band == "open":
        passed += 1
        print("  ok  complete handoff derives gate band 'open'")
    else:
        failed += 1
        print(f"FAIL  complete handoff: expected 'open', got '{band}'")

    # Required layers all present means no deterministic pre-model repair.
    layers = {
        "mission": "Finish the grant scoring interface.",
        "currentState": "Layout done, logic partial.",
        "unresolvedRisks": "Aggregated display may be misread.",
        "nextAction": "Implement the explanation component and test it.",
        "definitionOfDone": "Applicants understand decisions with no private data leaked.",
    }
    missing = [k for k in m.REQUIRED_LAYERS if not str(layers.get(k, "")).strip()]
    if not missing:
        passed += 1
        print("  ok  no required layer is missing")
    else:
        failed += 1
        print(f"FAIL  unexpected missing layers: {missing}")

    return passed, failed


if __name__ == "__main__":
    run()
