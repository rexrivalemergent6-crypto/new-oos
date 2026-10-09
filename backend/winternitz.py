"""
Winternitz One-Time Signature (WOTS) — byte-exact Python reimplementation of
`solana-winternitz` v0.1.1, the crate used by the mainnet Winternitz Vault
program (13EtnfYGUH8NaGAnUpDTVgSsXoewNnULp7ESwHzQUANT).

Scheme (224-bit truncated Keccak):
  HASH_LENGTH = 28
  hash(x)      = keccak256(x)[:28]          (first 28 bytes of Keccak-256)
  privkey      = 32 chains x 28 random bytes
  pubkey[i]    = hash^256(priv[i])
  digest       = keccak256(message)          (full 32 bytes, single hash)
  sign[i]      = hash^(256 - digest[i])(priv[i])
  recover[i]   = hash^(digest[i])(sign[i])   == pubkey[i]
  merklize     = balanced binary merkle tree of the 32 pubkey chains,
                 node = keccak256(left || right)  -> 32-byte root (PDA seed)

Validated against the crate's published test vector (see tests).
"""
from __future__ import annotations
import os
from Crypto.Hash import keccak

HASH_LENGTH = 28
N_CHAINS = 32
PRIV_LEN = HASH_LENGTH * N_CHAINS   # 896
SIG_LEN = HASH_LENGTH * N_CHAINS    # 896
PUB_LEN = HASH_LENGTH * N_CHAINS    # 896


def keccak256(data: bytes) -> bytes:
    h = keccak.new(digest_bits=256)
    h.update(data)
    return h.digest()


def _hash(x: bytes) -> bytes:
    """One chain step: keccak256 truncated to the first 28 bytes."""
    return keccak256(x)[:HASH_LENGTH]


def _chains_from_bytes(blob: bytes) -> list[bytes]:
    assert len(blob) == PRIV_LEN, f"expected {PRIV_LEN} bytes, got {len(blob)}"
    return [blob[i * HASH_LENGTH:(i + 1) * HASH_LENGTH] for i in range(N_CHAINS)]


def generate_privkey() -> bytes:
    """Return 896 random bytes = 32 chains x 28 bytes."""
    return os.urandom(PRIV_LEN)


def derive_pubkey(priv: bytes) -> list[bytes]:
    chains = _chains_from_bytes(priv)
    out = []
    for seed in chains:
        x = seed
        for _ in range(256):
            x = _hash(x)
        out.append(x)
    return out


def merklize(pub_chains: list[bytes]) -> bytes:
    """Balanced binary merkle root of the 32 pubkey chains -> 32-byte PDA seed."""
    layer = list(pub_chains)
    while len(layer) > 1:
        layer = [keccak256(layer[i] + layer[i + 1]) for i in range(0, len(layer), 2)]
    return layer[0]


def pubkey_merkle_root(priv: bytes) -> bytes:
    return merklize(derive_pubkey(priv))


def sign(priv: bytes, message: bytes) -> bytes:
    """Produce an 896-byte WOTS signature over `message` (single keccak digest)."""
    digest = keccak256(message)
    chains = _chains_from_bytes(priv)
    parts = []
    for i in range(N_CHAINS):
        x = chains[i]
        for _ in range(256 - digest[i]):
            x = _hash(x)
        parts.append(x)
    return b"".join(parts)


def recover_pubkey(signature: bytes, message: bytes) -> list[bytes]:
    assert len(signature) == SIG_LEN, f"sig must be {SIG_LEN} bytes"
    digest = keccak256(message)
    sig_chains = [signature[i * HASH_LENGTH:(i + 1) * HASH_LENGTH] for i in range(N_CHAINS)]
    out = []
    for i in range(N_CHAINS):
        x = sig_chains[i]
        for _ in range(digest[i]):
            x = _hash(x)
        out.append(x)
    return out


def recover_merkle_root(signature: bytes, message: bytes) -> bytes:
    return merklize(recover_pubkey(signature, message))
