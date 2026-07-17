import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  CONTRACT_ADDRESS,
  submitWalletWrite,
} from '../src/genlayer/chain.js';
import { assertSuccessfulTransaction } from '../src/genlayer/tx.js';

const WALLET = '0x1111111111111111111111111111111111111111';
const HASH = `0x${'ab'.repeat(32)}`;
const provider = { request: async () => null };

test('browser wallet write uses injected provider and submitted contract', async () => {
  const deployment = JSON.parse(
    await readFile(new URL('../../deployment.json', import.meta.url), 'utf8'),
  );
  const captured = {};
  const clientFactory = (config) => {
    captured.config = config;
    return {
      writeContract: async (request) => {
        captured.request = request;
        return HASH;
      },
    };
  };

  const result = await submitWalletWrite({
    account: WALLET,
    provider,
    functionName: 'create_baton',
    args: ['title', 'receiver', '{}'],
    clientFactory,
  });

  assert.equal(CONTRACT_ADDRESS, deployment.address);
  assert.equal(captured.config.account, WALLET);
  assert.equal(captured.config.provider, provider);
  assert.equal(captured.request.address, deployment.address);
  assert.equal(captured.request.functionName, 'create_baton');
  assert.equal(result.hash, HASH);
});

test('wallet rejection propagates and cannot become UI success', async () => {
  const rejected = new Error('User rejected the request');
  const clientFactory = () => ({ writeContract: async () => { throw rejected; } });
  await assert.rejects(
    submitWalletWrite({ account: WALLET, provider, functionName: 'create_baton', clientFactory }),
    /User rejected/,
  );
});

test('a write without an injected provider is rejected before submission', async () => {
  await assert.rejects(
    submitWalletWrite({ account: WALLET, provider: null, functionName: 'create_baton' }),
    /injected browser wallet provider/,
  );
});

test('a missing transaction hash is a hard failure', async () => {
  const clientFactory = () => ({ writeContract: async () => null });
  await assert.rejects(
    submitWalletWrite({ account: WALLET, provider, functionName: 'create_baton', clientFactory }),
    /no transaction hash/,
  );
});

test('terminal status is not success when contract execution failed', () => {
  assert.throws(
    () => assertSuccessfulTransaction({
      status: 'ACCEPTED',
      tx: { txExecutionResultName: 'USER_ERROR' },
    }),
    /Contract execution failed/,
  );
});

test('accepted successful contract execution is verified', () => {
  const tx = { txExecutionResultName: 'FINISHED_WITH_RETURN' };
  assert.equal(assertSuccessfulTransaction({ status: 'ACCEPTED', tx }), tx);
});