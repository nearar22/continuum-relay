"""Full on-chain lifecycle against the live contract with TWO real accounts:
sender creates + gates a clean baton, receiver mirrors it correctly, receiver
accepts, and a continuity proof is minted. Proves the two-party mechanic on-chain."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client, read_view, load_pk  # noqa: E402
from genlayer_py import create_client, create_account  # noqa: E402
from genlayer_py.chains import testnet_bradbury  # noqa: E402

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
    sender_client, sender = make_client()

    rk = open(os.path.join(os.path.dirname(__file__), "receiver_key.txt")).read().strip()
    if not rk.startswith("0x"):
        rk = "0x" + rk
    receiver_acct = create_account(account_private_key=rk)
    receiver_client = create_client(chain=testnet_bradbury, account=receiver_acct)

    print("Contract:", addr)
    print("Sender:", sender.address)
    print("Receiver:", receiver_acct.address)

    # A clean, complete baton that should pass the gate (no contradiction).
    layers = {
        "mission": "Migrate the billing service from the legacy cron job to the new event queue.",
        "originalIntent": "Make invoice generation reliable so customers stop getting duplicate or missing invoices.",
        "currentState": "The new queue consumer is deployed to staging and processing test events correctly. Production is still on the old cron.",
        "completedWork": "Queue consumer, idempotency keys on invoice creation, and staging validation against last month replay.",
        "unresolvedRisks": "Cutover must not double-bill. The old cron and new consumer must never run at the same time in production.",
        "decisions": "Cut over during the Sunday 02:00 maintenance window. Keep the old cron code for one week as rollback.",
        "constraints": "Do not delete the old cron until one full billing cycle has passed on the new queue.",
        "nextAction": "Disable the production cron, enable the queue consumer in production, and watch the first 50 invoices.",
        "definitionOfDone": "Production invoices are generated only by the queue, no duplicates across one billing cycle, and rollback is documented.",
        "peopleWaiting": "Finance team needs confirmation before they reconcile the month.",
    }

    print("\n1) create_baton (sender)")
    tx = sender_client.write_contract(
        address=addr, function_name="create_baton",
        args=["Billing queue cutover handoff", "Platform engineer", json.dumps(layers)],
    )
    wait(sender_client, tx, "create")
    batons = read_view(sender_client, sender, addr, "get_batons", [0])
    baton_id = batons[0]["id"]
    print("  baton_id:", baton_id)

    print("\n2) evaluate_baton_completeness (gate, sender)")
    tx2 = sender_client.write_contract(address=addr, function_name="evaluate_baton_completeness", args=[baton_id])
    wait(sender_client, tx2, "gate")
    baton = read_view(sender_client, sender, addr, "get_baton", [baton_id])
    print("  gateBand:", baton.get("gateBand"), "status:", baton.get("status"), "score:", baton.get("continuityScore"))

    if baton.get("gateBand") != "open":
        print("  gate did not open; stopping (gate is doing its job).")
        _dump(root, addr, baton_id, baton, None)
        return

    print("\n3) submit_receiver_mirror (receiver, a faithful restatement)")
    mirror = {
        "task": "Take over the billing migration from legacy cron to the event queue and own the production cutover.",
        "nextAction": "Disable the production cron, turn on the queue consumer, and watch the first 50 invoices for duplicates.",
        "keyRisk": "Running the cron and the consumer at the same time would double-bill customers.",
        "constraint": "Do not delete the old cron until a full billing cycle has passed on the queue.",
        "definitionOfDone": "Invoices come only from the queue, no duplicates over a cycle, rollback documented.",
    }
    tx3 = receiver_client.write_contract(
        address=addr, function_name="submit_receiver_mirror", args=[baton_id, json.dumps(mirror)],
    )
    wait(receiver_client, tx3, "mirror")
    baton = read_view(receiver_client, receiver_acct, addr, "get_baton", [baton_id])
    print("  mirrorBand:", baton.get("mirrorBand"), "status:", baton.get("status"))

    print("\n4) accept_baton (receiver)")
    tx4 = receiver_client.write_contract(address=addr, function_name="accept_baton", args=[baton_id])
    wait(receiver_client, tx4, "accept")
    baton = read_view(receiver_client, receiver_acct, addr, "get_baton", [baton_id])
    print("  status:", baton.get("status"), "proofHash:", baton.get("proofHash"))

    _dump(root, addr, baton_id, baton, baton.get("proofHash"))


def _dump(root, addr, baton_id, baton, proof):
    out = {
        "address": addr, "batonId": baton_id,
        "status": baton.get("status"), "gateBand": baton.get("gateBand"),
        "mirrorBand": baton.get("mirrorBand"), "continuityScore": baton.get("continuityScore"),
        "proofHash": proof,
    }
    with open(os.path.join(root, "scripts", "verify_full_out.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print("\nwrote verify_full_out.json:", json.dumps(out))


if __name__ == "__main__":
    main()
