"""Generate a second GenLayer account to act as the on-chain RECEIVER (the
contract requires receiver address != sender address). Prints the key + address.
We do not overwrite .env automatically; the value is written to receiver_key.txt
for the backend to load."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from eth_account import Account

Account.enable_unaudited_hdwallet_features()
acct = Account.create()
print("address:", acct.address)
out = os.path.join(os.path.dirname(__file__), "receiver_key.txt")
with open(out, "w", encoding="utf-8") as f:
    f.write(acct.key.hex())
print("wrote", out)
