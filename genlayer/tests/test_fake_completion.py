"""Test 5 - Fake completion.

The sender claims the work is done while the next action still requires core
implementation. The model reports this as low intent/state consistency, and the
contract derives a non-open band. We assert that a readings profile with weak
completeness and intent (the signature of a hollow 'done') does not open the gate.
"""
from conftest import load_contract_module

m = load_contract_module()


def run():
    passed = failed = 0

    # "Completed" but next action still needs core work: the model returns low
    # completeness and intent consistency, so the gate should not open.
    readings = {
        "completeness": 48,
        "intentPreservation": 40,
        "contradiction": 30,
        "riskClarity": 45,
        "nextActionClarity": 55,
        "definitionOfDoneClarity": 40,
    }
    band = m._gate_band(readings)
    if band != "open":
        passed += 1
        print(f"  ok  a fake completion does not open the gate (got '{band}')")
    else:
        failed += 1
        print("FAIL  a fake completion should not open the gate")

    # If the contradiction signal is strong (claims done, plainly contradicts
    # the remaining work), it escalates to blocked.
    readings_block = dict(readings)
    readings_block["contradiction"] = 65
    if m._gate_band(readings_block) == "blocked":
        passed += 1
        print("  ok  a contradictory fake completion escalates to 'blocked'")
    else:
        failed += 1
        print("FAIL  contradictory fake completion should block")

    return passed, failed


if __name__ == "__main__":
    run()
