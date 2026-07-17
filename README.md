```
BATON #0000  ::  continuum-relay
FROM   the builder
TO     whoever picks this up next
GATE   open  ::  continuity 100  ::  live on GenLayer Bradbury
PROOF  contract 0x506a4b01D85A23BdF5817EEA6DB370a550DD4753
```

This README is itself a baton. The protocol below exists to pass work between
two people without losing the thread, so this document is handed to you the same
way: as a sealed baton with every layer the protocol requires. Read it in order
and you have received the project, not just its summary. The continuity gate at
the top is open because nothing essential has been left out.

Live app:
https://continuum-relay-8ny.pages.dev/
Contract on the explorer:
https://explorer-bradbury.genlayer.com/address/0x506a4b01D85A23BdF5817EEA6DB370a550DD4753
Deployed by tx
https://explorer-bradbury.genlayer.com/tx/0x39295612bbb8b02b98e0425b06bd4a46614f6fb07804ca4ed2f608842508fb6a

## REVIEW FIXES (this resubmission)

The reviewer asked for three things; all three are addressed:

1. The injected browser-wallet provider is now wired into genlayer-js. Every
   write builds its client with both the connected account and
   `window.ethereum` (`submitWalletWrite` in `frontend/src/genlayer/chain.js`),
   so MetaMask or Rabby signs `eth_sendTransaction` to the deployed contract.
2. Failed writes are surfaced instead of continuing. `runWrite` fails closed on
   wallet rejection, a missing transaction hash, timeout, cancellation,
   undetermined consensus, or a non-successful execution result
   (`assertSuccessfulTransaction` in `frontend/src/genlayer/tx.js`). The UI only
   reports success and shows the explorer link after a verified transaction.
3. A repository test proves a wallet-signed write reaches the submitted
   contract: `frontend/tests/wallet-write.test.mjs`, run with
   `cd frontend && npm test`.

Live proof, a `create_baton` write signed in MetaMask on the deployed site and
accepted on-chain (From is the browser wallet, To is the submitted contract):

> ACCEPTED, CONTRACT_CALL
> From `0xc8Cec80b192750dfe41274a0f43fE1AA7ca75Ea` (browser wallet)
> To   `0x506a4b01D85A23BdF5817EEA6DB370a550DD4753` (Continuum Relay contract)
> https://explorer-bradbury.genlayer.com/tx/0xbf0f81dd1af17ee33b50675c5d3a83ba710c7f85c47aae380766e550078b0dae

---

## MISSION

Stop context from dying in the gap between two people. When a developer hands
off to a maintainer, an EU on-call hands off to a US on-call, or one grant
reviewer hands off to the next, the words survive the pass but the understanding
does not. Continuum Relay makes a handoff move only when meaning provably
survives it, judged on-chain by GenLayer rather than asserted by a server.

## ORIGINAL INTENT

A normal contract can confirm a field exists, a status changed, an address
signed. It cannot judge whether a next action still serves the original goal,
whether two instructions contradict, or whether a receiver's restatement quietly
breaks a protected rule. Those are judgments about meaning. GenLayer validators
independently re-run that judgment and must agree before state moves, so the
judgment itself becomes the settlement. That is the whole reason this lives on
GenLayer and not on a single server with an API key.

## CURRENT STATE

Live on GenLayer Bradbury (chain 4221). Contract views are the frontend's source
of truth. Every state-changing UI action (`create_baton`,
`evaluate_baton_completeness`, `submit_receiver_mirror`, `request_repair`, and
`accept_baton`) is submitted through `genlayer-js` with the connected address
and the injected `window.ethereum` provider, so MetaMask or Rabby signs it.
The runway's "pass" animation is explicitly UI-only; it does not claim a state
transition. Local scoring is used only for an untrusted composition preview;
the stored gate and mirror judgments always come from validator consensus.

The full two-party lifecycle has also been exercised on-chain: a contradictory
baton was Blocked, while a clean baton was Opened, mirrored by a second wallet,
accepted, and sealed with a continuity proof.

## COMPLETED WORK

```
genlayer/continuum_relay_contract.py   gate + mirror + repair, lints clean
frontend (React + Vite + genlayer-js)  reads views; injected wallet signs writes
the browser write boundary              fails on reject, missing hash, timeout, or execution error
the continuity gate                     create_baton, evaluate_baton_completeness
the receiver mirror                    submit_receiver_mirror, a second signer
acceptance + proof                     accept_baton mints a continuity proof
scripts/                               deploy, fund a receiver, verify full flow
```

The reader can verify the live state without trusting this paragraph:

```
get_stats()        totals: batons, evaluations, accepted
get_batons(start)  the relay, newest first
get_baton(id)      one baton with its layers, gate reading, mirror, proof
get_proof(id)      the sealed continuity proof for an accepted baton
```

## UNRESOLVED RISKS

The receiver MUST be a different wallet than the sender; the contract refuses a
same-address handoff, so a real two-party demo needs two funded wallets. AI
writes run under validator consensus and can take minutes. The UI now fails
closed: wallet rejection, missing transaction hash, timeout, cancellation,
undetermined consensus, or a non-successful contract execution all stop the
flow and surface an error. Success UI is emitted only after the submitted hash
reaches ACCEPTED/FINALIZED with `FINISHED_WITH_RETURN` or
`FINISHED_WITHOUT_RETURN`. Bradbury RPC rate-limits bursts; reads retry with
backoff.

## DECISIONS

The gate and the mirror each wrap a single nondeterministic model call, but the
DECISION is derived in code by argmax over the readings, so validators agree on a
band rather than on raw subjective numbers. A real contradiction forces Blocked
no matter how polished the rest reads. Acceptance is gated in code by the mirror
band, never by the model's verdict alone. These are deterministic backstops
around a semantic judgment, on purpose.

## CONSTRAINTS (do not change without reading the code)

Required layers (mission, currentState, unresolvedRisks, nextAction,
definitionOfDone) are checked deterministically BEFORE any model runs; a missing
one is Needs Repair without spending a consensus round. The solving rationale and
any protected note are never returned by a view. A settled baton cannot be
re-passed or repaired. Acceptance never opens on a Critical Omission or a
violated protected constraint, however confident the restatement sounds.

## NEXT ACTION (run it yourself)

```
# 1. read the live contract, no wallet needed
cd frontend
npm install
npm run dev            # open the app, browse real batons from the chain

# 2. prove the production browser-write seam is wired correctly
npm test              # provider + wallet address + submitted contract; failure propagation

# 3. to write (compose, gate, mirror, repair, accept), connect MetaMask or
#    Rabby on Bradbury and claim test GEN from the faucet first

# 4. redeploy your own instance, or re-verify the full lifecycle
cd ../scripts
python deploy.py            # deploy the contract, writes deployment.json
python verify_full.py       # create, gate-open, mirror, accept, prove on-chain
```

The repository has two test layers. `frontend/tests/wallet-write.test.mjs`
exercises the same exported submission function used by the UI and asserts that
`genlayer-js` receives the injected EIP-1193 provider and connected account,
that `writeContract` targets the address in `deployment.json`, and that wallet
rejection or a missing provider propagates instead of producing success. The
contract tests cover a complete handoff, missing context, a contradictory
summary, a receiver misunderstanding, a fake completion, and a repair loop:

```
cd genlayer && python tests/runner.py
```

## DEFINITION OF DONE (how you know this baton was received)

You can state, without re-reading: that GenLayer is load-bearing here because the
continuity-of-meaning judgment IS the on-chain settlement; that each browser
write is signed through the injected wallet and cannot advance the UI without a
verified successful transaction; that the receiver is a different person who
must mirror their understanding before acceptance; and that the deployed state
is verifiable against the contract in the gate header. If so, the thread held.
The baton is yours.

## PEOPLE WAITING

The next contributor, who should not have to reverse-engineer any of the above
from the source. If you extend this, hand the next baton forward the same way.
```
ACK / receiver signs:  ____________________
```
