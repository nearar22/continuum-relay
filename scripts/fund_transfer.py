"""Transfer native GEN from the deployer to the receiver account."""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client  # noqa: E402

RECEIVER = "0x6624e2Ec98CA4708E94E0a877F9df9Dd61925C2c"
AMOUNT = 20 * 10**18  # 20 GEN


def main():
    client, account = make_client()
    print("From:", account.address, "-> To:", RECEIVER, "amount:", AMOUNT)
    # Try the genlayer_py / web3-style transfer through the provider.
    nonce_hex = client.provider.make_request(
        method="eth_getTransactionCount", params=[account.address, "latest"]
    )["result"]
    nonce = int(nonce_hex, 16)
    print("nonce:", nonce)

    from eth_account import Account
    from gl import load_pk
    acct = Account.from_key(load_pk())

    try:
        gp_hex = client.provider.make_request(method="eth_gasPrice", params=[])["result"]
        gas_price = int(gp_hex, 16)
    except Exception:
        gas_price = 0
    if gas_price <= 0:
        gas_price = 10**9  # 1 gwei fallback
    print("gasPrice:", gas_price)

    tx = {
        "to": RECEIVER,
        "value": AMOUNT,
        "gas": 21000,
        "maxFeePerGas": gas_price * 2,
        "maxPriorityFeePerGas": gas_price,
        "nonce": nonce,
        "chainId": 4221,
    }
    try:
        signed = acct.sign_transaction(tx)
        raw = signed.raw_transaction.hex()
        if not raw.startswith("0x"):
            raw = "0x" + raw
        res = client.provider.make_request(
            method="eth_sendRawTransaction", params=[raw]
        )
        print("send result:", res)
    except Exception as e:
        print("transfer err:", e)


if __name__ == "__main__":
    main()
