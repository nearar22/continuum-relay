"""End-to-end check against the live deployed Continuum Relay contract:
create a baton, run the continuity gate, read it back."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client, read_view  # noqa: E402

TERMINAL = {"ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED"}


def wait(client, tx_hash, label):
    for i in range(120):
        try:
            t = client.get_transaction(transaction_hash=tx_hash)
        except Exception as e:
            print(f"  [{label}:{i}] decode err: {e}", flush=True)
            time.sleep(8)
            continue
        name = t.get("status_name") or t.get("status") if isinstance(t, dict) else None
        exec_name = t.get("tx_execution_result_name") if isinstance(t, dict) else None
        print(f"  [{label}:{i}] status={name} exec={exec_name}", flush=True)
        if str(name) in TERMINAL:
            return t
        time.sleep(8)
    return None


def main():
    root = os.path.dirname(os.path.dirname(__file__))
    addr = json.load(open(os.path.join(root, "deployment.json")))["address"]
    client, account = make_client()
    print("Contract:", addr)
    print("Sender:", account.address)

    layers = {
        "mission": "Ship the password reset flow for the mobile app before the Q3 security audit.",
        "originalIntent": "Reduce account lockout support tickets by letting users self-serve resets securely.",
        "currentState": "Backend reset-token endpoint is done and tested. Mobile UI is wired but the deep link from email is not validated yet.",
        "completedWork": "Token endpoint, rate limiting, email template, and the reset form screen.",
        "unresolvedRisks": "The deep link can be opened twice, which could consume the token before the user finishes. Needs single-use enforcement on open.",
        "decisions": "Tokens expire in 30 minutes. We do not log token values anywhere.",
        "constraints": "Never log or expose raw reset tokens. Do not weaken the 30 minute expiry.",
        "nextAction": "Enforce single-use on deep link open and validate the link signature before showing the reset form.",
        "definitionOfDone": "A user can reset once per token, a reused link shows an expired state, and no token is ever written to logs.",
        "peopleWaiting": "Mobile QA lead is blocked on this for the audit dry run.",
    }

    print("\n1) create_baton")
    tx = client.write_contract(
        address=addr, function_name="create_baton",
        args=["Mobile password reset handoff", "Mobile engineer", json.dumps(layers)],
    )
    print("  tx:", tx)
    wait(client, tx, "create")

    batons = read_view(client, account, addr, "get_batons", [0])
    print("  batons now:", len(batons))
    baton_id = batons[0]["id"] if batons else "baton-1"
    print("  baton_id:", baton_id)

    print("\n2) evaluate_baton_completeness (AI continuity gate, on-chain)")
    tx2 = client.write_contract(
        address=addr, function_name="evaluate_baton_completeness", args=[baton_id],
    )
    print("  tx:", tx2)
    wait(client, tx2, "gate")

    baton = read_view(client, account, addr, "get_baton", [baton_id])
    print("\nRESULT:")
    print("  status:", baton.get("status"))
    print("  gateBand:", baton.get("gateBand"))
    print("  continuityScore:", baton.get("continuityScore"))
    gate = baton.get("gate") or {}
    print("  readings:", json.dumps(gate.get("readings", {})))
    print("  issues:", json.dumps(gate.get("issues", [])))

    out = {
        "address": addr, "batonId": baton_id,
        "status": baton.get("status"), "gateBand": baton.get("gateBand"),
        "continuityScore": baton.get("continuityScore"),
        "readings": gate.get("readings", {}),
    }
    with open(os.path.join(root, "scripts", "verify_live_out.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print("\nwrote verify_live_out.json")


if __name__ == "__main__":
    main()
