// genlayerRelay.js
// ================
// The REAL GenLayer adapter. Continuum Relay is not a mock: every baton, gate
// evaluation, receiver mirror, acceptance, and continuity proof is a live
// transaction against the deployed Intelligent Contract on the Bradbury testnet.
//
// Two funded signers drive the two-party mechanic the contract enforces:
//   - SENDER  (deployer key) composes and gates batons.
//   - RECEIVER (a second funded key) mirrors and accepts, because the contract
//     hard-requires the receiver address to differ from the sender.
//
// Reads go through gen_call (raw provider) because the high-level read decode is
// brittle on Bradbury; writes are submitted and polled to a terminal status.

const { createClient, createAccount } = require('genlayer-js');
const { testnetBradbury } = require('genlayer-js/chains');

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
  || '0x506a4b01D85A23BdF5817EEA6DB370a550DD4753';

const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);
const POLL_INTERVAL_MS = 4000;
const POLL_TRIES = 150;

function normKey(k) {
  if (!k) return null;
  const t = String(k).trim().replace(/^['"]|['"]$/g, '');
  return t.startsWith('0x') ? t : `0x${t}`;
}

const SENDER_KEY = normKey(process.env.GENLAYER_PRIVATE_KEY);
const RECEIVER_KEY = normKey(process.env.RECEIVER_PRIVATE_KEY);

if (!SENDER_KEY) {
  throw new Error('GENLAYER_PRIVATE_KEY is required for the real GenLayer relay');
}

const senderAccount = createAccount(SENDER_KEY);
const senderClient = createClient({ chain: testnetBradbury, account: senderAccount });

let receiverAccount = null;
let receiverClient = null;
if (RECEIVER_KEY) {
  receiverAccount = createAccount(RECEIVER_KEY);
  receiverClient = createClient({ chain: testnetBradbury, account: receiverAccount });
}

const readClient = createClient({ chain: testnetBradbury });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Poll a submitted transaction until it reaches a terminal status.
async function waitForTx(client, txHash) {
  for (let i = 0; i < POLL_TRIES; i += 1) {
    try {
      const receipt = await client.getTransaction({ hash: txHash });
      const status = receipt?.statusName || receipt?.status;
      if (status && TERMINAL.has(String(status))) {
        return receipt;
      }
    } catch {
      // decode hiccup on an intermediate status; keep polling
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`transaction ${txHash} did not finalize in time`);
}

async function readView(functionName, args = []) {
  return readClient.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  });
}

async function write(client, functionName, args = []) {
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  });
  const receipt = await waitForTx(client, txHash);
  const exec = receipt?.txExecutionResultName
    || receipt?.tx_execution_result_name
    || receipt?.statusName;
  return { txHash, receipt, exec };
}

module.exports = {
  CONTRACT_ADDRESS,
  hasReceiver: () => Boolean(receiverClient),
  senderAddress: () => senderAccount.address,
  receiverAddress: () => (receiverAccount ? receiverAccount.address : ''),
  readView,
  writeAsSender: (fn, args) => write(senderClient, fn, args),
  writeAsReceiver: (fn, args) => {
    if (!receiverClient) {
      throw new Error('RECEIVER_PRIVATE_KEY is not configured; cannot sign receiver transactions');
    }
    return write(receiverClient, fn, args);
  },
};
