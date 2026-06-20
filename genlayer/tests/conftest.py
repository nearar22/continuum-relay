"""Shared helpers for Continuum Relay contract tests.

These tests exercise the deterministic decision logic of the contract (the gate
band derivation, the contradiction and missing-layer guards, and the receiver
mirror band) without requiring a live network. They import the pure functions
from the contract module directly, which is exactly the logic validators agree
on after the LLM proposes its readings.
"""
import importlib.util
import os

_HERE = os.path.dirname(__file__)
_CONTRACT = os.path.join(_HERE, "..", "continuum_relay_contract.py")


def load_contract_module():
    """Load the contract file as a module, skipping the line-1 runner header and
    the `from genlayer import *` line (which only exists on the GenVM runner) by
    providing a minimal shim so the pure helpers can be imported off-chain."""
    import types
    import sys

    # Minimal shim for the genlayer runtime so the module imports off-chain.
    shim = types.ModuleType("genlayer")

    class _U256(int):
        pass

    def _u256(x=0):
        return _U256(x)

    class _UserError(Exception):
        def __init__(self, message=""):
            super().__init__(message)
            self.message = message

    class _VM:
        UserError = _UserError

        @staticmethod
        def run_nondet_unsafe(leader_fn, validator_fn):
            return leader_fn()

    def _passthrough(fn):
        return fn

    class _Public:
        write = staticmethod(_passthrough)
        view = staticmethod(_passthrough)

    class _GL:
        vm = _VM()
        Contract = object
        public = _Public()

    class _StorageType:
        def __getitem__(self, item):
            return dict

    shim.gl = _GL()
    shim.u256 = _u256
    shim.Address = str
    shim.TreeMap = _StorageType()
    shim.DynArray = _StorageType()
    shim.Contract = object
    # `from genlayer import *` pulls these names into the module namespace.
    shim.__all__ = ["gl", "u256", "Address", "TreeMap", "DynArray", "Contract"]
    sys.modules["genlayer"] = shim

    src_lines = open(_CONTRACT, "r", encoding="utf-8").read().splitlines()
    # Drop the line-1 runner header comment; keep the rest.
    body = "\n".join(src_lines[1:])
    mod = types.ModuleType("continuum_relay_contract")
    mod.__dict__["__name__"] = "continuum_relay_contract"
    exec(compile(body, _CONTRACT, "exec"), mod.__dict__)
    return mod
