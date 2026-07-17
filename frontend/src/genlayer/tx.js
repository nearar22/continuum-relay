// tx.js
// =====
// Transaction status decoding for GenLayer writes. The installed SDK can throw
// while parsing a submission receipt even though the transaction is live, so
// callers confirm success by polling contract state. This module surfaces the
// real on-chain status name while a write is in flight.

const STATUS_NAME = {
  '0': 'UNINITIALIZED',
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
  '14': 'ACTIVATED',
};

export const statusName = (s) => {
  if (s === undefined || s === null) return 'PENDING';
  const byCode = STATUS_NAME[String(s)];
  if (byCode) return byCode;
  return String(s).toUpperCase();
};

const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export const isTerminal = (name) => TERMINAL.has(name);

const SUCCESSFUL_EXECUTION = new Set(['FINISHED_WITH_RETURN', 'FINISHED_WITHOUT_RETURN']);

export function assertSuccessfulTransaction(decision) {
  const status = statusName(decision?.status);
  if (status === 'TIMEOUT') throw new Error('Transaction confirmation timed out.');
  if (status === 'CANCELED') throw new Error('Transaction was canceled.');
  if (status === 'UNDETERMINED') throw new Error('Validator consensus was undetermined.');
  if (status !== 'ACCEPTED' && status !== 'FINALIZED') {
    throw new Error(`Transaction stopped in unexpected status ${status}.`);
  }

  const tx = decision?.tx;
  const execution = String(
    tx?.txExecutionResultName ?? tx?.tx_execution_result_name ?? '',
  ).toUpperCase();
  if (!SUCCESSFUL_EXECUTION.has(execution)) {
    throw new Error(
      execution
        ? `Contract execution failed with ${execution}.`
        : 'Contract execution result could not be verified.',
    );
  }
  return tx;
}

export async function pollUntilDecided(client, hash, onUpdate, opts = {}) {
  const { tries = 200, intervalMs = 8000 } = opts;
  for (let i = 0; i < tries; i += 1) {
    const tx = await client.getTransaction({ hash }).catch(() => null);
    const status = statusName(tx ? (tx.statusName ?? tx.status) : 'PENDING');
    onUpdate?.(status);
    if (TERMINAL.has(status)) return { status, tx };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: 'TIMEOUT', tx: null };
}
