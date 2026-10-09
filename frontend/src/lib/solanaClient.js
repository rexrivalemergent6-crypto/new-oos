import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { getPhantom } from "./phantom";

let _conn = null;
let _rpc = null;

export function initConnection(rpcUrl) {
  if (!_conn || _rpc !== rpcUrl) {
    _rpc = rpcUrl;
    _conn = new Connection(rpcUrl, "confirmed");
  }
  return _conn;
}

export function getConnection() {
  return _conn;
}

function ixFromDescriptor(desc) {
  return new TransactionInstruction({
    programId: new PublicKey(desc.programId),
    keys: desc.keys.map((k) => ({
      pubkey: new PublicKey(k.pubkey),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: Buffer.from(desc.data, "base64"),
  });
}

async function buildAndSend(instructions, feePayer, computeUnits) {
  const conn = getConnection();
  const p = getPhantom();
  if (!p) throw new Error("Phantom not found");
  const tx = new Transaction();
  if (computeUnits) {
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }));
  }
  instructions.forEach((ix) => tx.add(ix));
  tx.feePayer = new PublicKey(feePayer);
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  const { signature } = await p.signAndSendTransaction(tx);
  await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
}

// Merchant opens a vault (pays rent + fee). ~34-byte instruction.
export async function sendOpenVault(descriptor, feePayer) {
  return buildAndSend([ixFromDescriptor(descriptor.instruction)], feePayer, 200000);
}

// Merchant closes a vault (one-time WOTS sig). Heavy keccak -> high CU limit.
export async function sendCloseVault(descriptor, feePayer) {
  return buildAndSend([ixFromDescriptor(descriptor.instruction)], feePayer, 1000000);
}

// Customer pays SOL to the vault address (plain system transfer).
export async function sendPayment(fromPubkey, vaultAddress, lamports) {
  const ix = SystemProgram.transfer({
    fromPubkey: new PublicKey(fromPubkey),
    toPubkey: new PublicKey(vaultAddress),
    lamports,
  });
  return buildAndSend([ix], fromPubkey, null);
}
