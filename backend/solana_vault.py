"""
Builds real mainnet instructions for the Winternitz Vault program
(13EtnfYGUH8NaGAnUpDTVgSsXoewNnULp7ESwHzQUANT).

Instruction byte layout (from on-chain source, native/pinocchio program):
  discriminator: 0 = OpenVault, 1 = SplitVault, 2 = CloseVault

  OpenVault  data = [0] + merkle_root(32) + bump(1)            = 34 bytes
             accts = [payer(signer,w), vault(w), system_program(r)]
  CloseVault data = [2] + wots_signature(896) + bump(1)        = 898 bytes
             accts = [vault(w), refund(signer,w)]

PDA: find_program_address([merkle_root], PROGRAM_ID)  -> vault, bump
"""
from __future__ import annotations
import base64
import os
from pathlib import Path
from dotenv import load_dotenv
from solders.pubkey import Pubkey

load_dotenv(Path(__file__).parent / ".env")

PROGRAM_ID = Pubkey.from_string(os.environ["VAULT_PROGRAM_ID"])
SYSTEM_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")

# Rent-exempt minimum for a 0-byte account on Solana (lamports). Fixed protocol value.
VAULT_RENT_LAMPORTS = 890880
LAMPORTS_PER_SOL = 1_000_000_000


def derive_vault(merkle_root: bytes):
    """Return (vault_address_str, bump) for a given 32-byte WOTS merkle root."""
    assert len(merkle_root) == 32
    vault, bump = Pubkey.find_program_address([merkle_root], PROGRAM_ID)
    return str(vault), bump


def open_vault_instruction(merkle_root: bytes, bump: int, payer: str, vault: str) -> dict:
    data = bytes([0]) + merkle_root + bytes([bump])
    return {
        "programId": str(PROGRAM_ID),
        "data": base64.b64encode(data).decode(),
        "keys": [
            {"pubkey": payer, "isSigner": True, "isWritable": True},
            {"pubkey": vault, "isSigner": False, "isWritable": True},
            {"pubkey": str(SYSTEM_PROGRAM_ID), "isSigner": False, "isWritable": False},
        ],
    }


def close_vault_instruction(signature: bytes, bump: int, vault: str, refund: str) -> dict:
    assert len(signature) == 896, "WOTS signature must be 896 bytes"
    data = bytes([2]) + signature + bytes([bump])
    return {
        "programId": str(PROGRAM_ID),
        "data": base64.b64encode(data).decode(),
        "keys": [
            {"pubkey": vault, "isSigner": False, "isWritable": True},
            {"pubkey": refund, "isSigner": True, "isWritable": True},
        ],
    }


def split_message(amount_lamports: int, split: str, refund: str) -> bytes:
    """72-byte message the WOTS signature covers: amount(8 LE) + split(32) + refund(32)."""
    return (
        int(amount_lamports).to_bytes(8, "little")
        + bytes(Pubkey.from_string(split))
        + bytes(Pubkey.from_string(refund))
    )


def split_vault_instruction(signature: bytes, amount_lamports: int, bump: int,
                            vault: str, split: str, refund: str) -> dict:
    assert len(signature) == 896, "WOTS signature must be 896 bytes"
    data = bytes([1]) + signature + int(amount_lamports).to_bytes(8, "little") + bytes([bump])
    return {
        "programId": str(PROGRAM_ID),
        "data": base64.b64encode(data).decode(),
        "keys": [
            {"pubkey": vault, "isSigner": False, "isWritable": True},
            {"pubkey": split, "isSigner": False, "isWritable": True},
            {"pubkey": refund, "isSigner": True, "isWritable": True},
        ],
    }


def is_valid_solana_address(address: str) -> bool:
    try:
        Pubkey.from_string(address)
        return True
    except Exception:
        return False
