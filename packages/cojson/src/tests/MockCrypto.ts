import { WasmCrypto } from "../crypto/WasmCrypto";
import {
  Encrypted,
  Hash,
  KeyID,
  KeySecret,
  Sealed,
  SealerID,
  SealerSecret,
  ShortHash,
  Signature,
  SignerID,
  SignerSecret,
} from "../crypto/crypto";
import {
  AgentID,
  AgentSecret,
  CryptoProvider,
  RawAccountID,
  RawCoID,
  SessionID,
} from "../exports";
import { TransactionID } from "../ids";
import { Stringified } from "../jsonStringify";
import { JsonValue } from "../jsonValue";

export class MockCrypto implements CryptoProvider<Uint8Array> {
  inner: WasmCrypto;

  constructor(wasmCrypto: WasmCrypto) {
    this.inner = wasmCrypto;
  }

  randomBytes(length: number): Uint8Array {
    throw new Error("Method not implemented.");
  }
  newEd25519SigningKey(): Uint8Array {
    throw new Error("Method not implemented.");
  }
  newRandomSigner(): SignerSecret {
    throw new Error("Method not implemented.");
  }
  signerSecretToBytes(secret: SignerSecret): Uint8Array {
    throw new Error("Method not implemented.");
  }
  signerSecretFromBytes(bytes: Uint8Array): SignerSecret {
    throw new Error("Method not implemented.");
  }
  getSignerID(secret: SignerSecret): SignerID {
    throw new Error("Method not implemented.");
  }
  sign(secret: SignerSecret, message: JsonValue): Signature {
    const signerID = this.getSignerID(secret);

    return `signature_z[${signerID}/${this.shortHash(message)}]` as Signature;
  }
  verify(signature: Signature, message: JsonValue, id: SignerID): boolean {
    const expected =
      `signature_z[${id}/${this.shortHash(message)}]` as Signature;
    if (signature !== expected) {
      throw new Error(
        `Signature ${signature} does not match expected ${expected}`,
      );
    }
    return true;
  }
  newX25519StaticSecret(): Uint8Array {
    throw new Error("Method not implemented.");
  }
  newRandomSealer(): SealerSecret {
    throw new Error("Method not implemented.");
  }
  sealerSecretToBytes(secret: SealerSecret): Uint8Array {
    throw new Error("Method not implemented.");
  }
  sealerSecretFromBytes(bytes: Uint8Array): SealerSecret {
    throw new Error("Method not implemented.");
  }
  getSealerID(secret: SealerSecret): SealerID {
    throw new Error("Method not implemented.");
  }
  newRandomAgentSecret(): AgentSecret {
    throw new Error("Method not implemented.");
  }
  agentSecretToBytes(secret: AgentSecret): Uint8Array {
    throw new Error("Method not implemented.");
  }
  agentSecretFromBytes(bytes: Uint8Array): AgentSecret {
    throw new Error("Method not implemented.");
  }
  getAgentID(secret: AgentSecret): AgentID {
    throw new Error("Method not implemented.");
  }
  getAgentSignerID(agentId: AgentID): SignerID {
    return this.inner.getAgentSignerID(agentId);
  }
  getAgentSignerSecret(agentSecret: AgentSecret): SignerSecret {
    throw new Error("Method not implemented.");
  }
  getAgentSealerID(agentId: AgentID): SealerID {
    throw new Error("Method not implemented.");
  }
  getAgentSealerSecret(agentSecret: AgentSecret): SealerSecret {
    throw new Error("Method not implemented.");
  }
  emptyBlake3State() {
    return this.inner.emptyBlake3State();
  }
  cloneBlake3State(state: Uint8Array) {
    return this.inner.cloneBlake3State(state);
  }
  blake3HashOnce(data: Uint8Array): Uint8Array {
    return this.inner.blake3HashOnce(data);
  }
  blake3HashOnceWithContext(
    data: Uint8Array,
    { context }: { context: Uint8Array },
  ): Uint8Array {
    return this.inner.blake3HashOnceWithContext(data, { context });
  }
  blake3IncrementalUpdate(state: any, data: Uint8Array) {
    return this.inner.blake3IncrementalUpdate(state, data);
  }
  blake3DigestForState(state: any): Uint8Array {
    return this.inner.blake3DigestForState(state);
  }
  secureHash(value: JsonValue): Hash {
    return this.inner.secureHash(value);
  }
  shortHash(value: JsonValue): ShortHash {
    return this.inner.shortHash(value);
  }
  encrypt<T extends JsonValue, N extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Encrypted<T, N> {
    throw new Error("Method not implemented.");
  }
  encryptForTransaction<T extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): Encrypted<T, { in: RawCoID; tx: TransactionID }> {
    throw new Error("Method not implemented.");
  }
  decryptRaw<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Stringified<T> {
    throw new Error("Method not implemented.");
  }
  decrypt<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): T | undefined {
    throw new Error("Method not implemented.");
  }
  newRandomKeySecret(): { secret: KeySecret; id: KeyID } {
    throw new Error("Method not implemented.");
  }
  decryptRawForTransaction<T extends JsonValue>(
    encrypted: Encrypted<T, { in: RawCoID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): Stringified<T> | undefined {
    throw new Error("Method not implemented.");
  }
  decryptForTransaction<T extends JsonValue>(
    encrypted: Encrypted<T, { in: RawCoID; tx: TransactionID }>,
    keySecret: KeySecret,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined {
    throw new Error("Method not implemented.");
  }
  encryptKeySecret(keys: {
    toEncrypt: { id: KeyID; secret: KeySecret };
    encrypting: { id: KeyID; secret: KeySecret };
  }): {
    encryptedID: KeyID;
    encryptingID: KeyID;
    encrypted: Encrypted<
      KeySecret,
      { encryptedID: KeyID; encryptingID: KeyID }
    >;
  } {
    throw new Error("Method not implemented.");
  }
  decryptKeySecret(
    encryptedInfo: {
      encryptedID: KeyID;
      encryptingID: KeyID;
      encrypted: Encrypted<
        KeySecret,
        { encryptedID: KeyID; encryptingID: KeyID }
      >;
    },
    sealingSecret: KeySecret,
  ): KeySecret | undefined {
    throw new Error("Method not implemented.");
  }
  seal<T extends JsonValue>({
    message,
    from,
    to,
    nOnceMaterial,
  }: {
    message: T;
    from: SealerSecret;
    to: SealerID;
    nOnceMaterial: { in: RawCoID; tx: TransactionID };
  }): Sealed<T> {
    throw new Error("Method not implemented.");
  }
  unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    sealer: SealerSecret,
    from: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined {
    throw new Error("Method not implemented.");
  }
  uniquenessForHeader(): `z${string}` {
    throw new Error("Method not implemented.");
  }
  createdNowUnique(): { createdAt: `2${string}`; uniqueness: `z${string}` } {
    throw new Error("Method not implemented.");
  }
  newRandomSecretSeed(): Uint8Array {
    throw new Error("Method not implemented.");
  }
  agentSecretFromSecretSeed(secretSeed: Uint8Array): AgentSecret {
    throw new Error("Method not implemented.");
  }
  newRandomSessionID(accountID: RawAccountID | AgentID): SessionID {
    throw new Error("Method not implemented.");
  }
}
