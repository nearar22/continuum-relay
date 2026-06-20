"""Fund the receiver account from the deployer so it can sign receiver-mirror
and accept transactions (the contract requires receiver != sender)."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client  # noqa: E402

RECEIVER = "0x6624e2Ec98CA4708E94E0a877F9df9Dd61925C2c"


def main():
    client, account = make_client()
    print("Deployer:", account.address)
    # Check balances via raw provider
    for label, addr in (("deployer", account.address), ("receiver", RECEIVER)):
        try:
            bal = client.provider.make_request(
                method="eth_getBalance", params=[addr, "latest"]
            )["result"]
            print(f"  {label} balance: {int(bal, 16)} ({addr})")
        except Exception as e:
            print(f"  {label} balance err: {e}")


if __name__ == "__main__":
    main()
