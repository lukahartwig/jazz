import { xsalsa20, xsalsa20poly1305 } from "@noble/ciphers/salsa";
import { ed25519, x25519 } from "@noble/curves/ed25519";
import { blake3 } from "@noble/hashes/blake3";
import { base58 } from "@scure/base";
import { base64URLtoBytes, bytesToBase64url } from "../base64url.js";
import { RawCoID, TransactionID } from "../ids.js";
import { Stringified, stableStringify } from "../jsonStringify.js";
import { JsonValue } from "../jsonValue.js";
import { logger } from "../logger.js";
import {
  CryptoProvider,
  Encrypted,
  KeySecret,
  Sealed,
  SealerID,
  SealerSecret,
  Signature,
  SignerID,
  SignerSecret,
  textDecoder,
  textEncoder,
} from "./crypto.js";

type Blake3State = ReturnType<typeof blake3.create>;

/**
 * Pure JavaScript implementation of the CryptoProvider interface using noble-curves and noble-ciphers libraries.
 * This provides a fallback implementation that doesn't require WebAssembly, offering:
 * - Signing/verifying (Ed25519)
 * - Encryption/decryption (XSalsa20)
 * - Sealing/unsealing (X25519 + XSalsa20-Poly1305)
 * - Hashing (BLAKE3)
 */
export class PureJSCrypto extends CryptoProvider<Blake3State> {
  static async create(): Promise<PureJSCrypto> {
    return new PureJSCrypto();
  }

  emptyBlake3State(): Blake3State {
    return blake3.create({});
  }

  cloneBlake3State(state: Blake3State): Blake3State {
    return state.clone();
  }

  blake3HashOnce(data: Uint8Array) {
    return blake3(data);
  }

  blake3HashOnceWithContext(
    data: Uint8Array,
    { context }: { context: Uint8Array },
  ) {
    return blake3.create({}).update(context).update(data).digest();
  }

  blake3IncrementalUpdate(state: Blake3State, data: Uint8Array) {
    return state.update(data);
  }

  blake3DigestForState(state: Blake3State): Uint8Array {
    return state.clone().digest();
  }

  generateNonce(input: Uint8Array): Uint8Array {
    return this.blake3HashOnce(input).slice(0, 24);
  }

  protected generateJsonNonce(material: JsonValue): Uint8Array {
    return this.generateNonce(textEncoder.encode(stableStringify(material)));
  }

  newEd25519SigningKey(): Uint8Array {
    return ed25519.utils.randomPrivateKey();
  }

  getSignerID(secret: SignerSecret): SignerID {
    return `signer_z${base58.encode(
      ed25519.getPublicKey(
        base58.decode(secret.substring("signerSecret_z".length)),
      ),
    )}`;
  }

  sign(secret: SignerSecret, message: JsonValue): Signature {
    const signature = ed25519.sign(
      textEncoder.encode(stableStringify(message)),
      base58.decode(secret.substring("signerSecret_z".length)),
    );
    return `signature_z${base58.encode(signature)}`;
  }

  verify(signature: Signature, message: JsonValue, id: SignerID): boolean {
    return ed25519.verify(
      base58.decode(signature.substring("signature_z".length)),
      textEncoder.encode(stableStringify(message)),
      base58.decode(id.substring("signer_z".length)),
    );
  }

  newX25519StaticSecret(): Uint8Array {
    return x25519.utils.randomPrivateKey();
  }

  getSealerID(secret: SealerSecret): SealerID {
    return `sealer_z${base58.encode(
      x25519.getPublicKey(
        base58.decode(secret.substring("sealerSecret_z".length)),
      ),
    )}`;
  }

  encrypt<T extends JsonValue, N extends JsonValue>(
    value: T,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Encrypted<T, N> {
    const keySecretBytes = base58.decode(
      keySecret.substring("keySecret_z".length),
    );
    const nOnce = this.generateJsonNonce(nOnceMaterial);

    const plaintext = textEncoder.encode(stableStringify(value));
    const ciphertext = xsalsa20(keySecretBytes, nOnce, plaintext);
    return `encrypted_U${bytesToBase64url(ciphertext)}` as Encrypted<T, N>;
  }

  decryptRaw<T extends JsonValue, N extends JsonValue>(
    encrypted: Encrypted<T, N>,
    keySecret: KeySecret,
    nOnceMaterial: N,
  ): Stringified<T> {
    const keySecretBytes = base58.decode(
      keySecret.substring("keySecret_z".length),
    );
    const nOnce = this.generateJsonNonce(nOnceMaterial);

    const ciphertext = base64URLtoBytes(
      encrypted.substring("encrypted_U".length),
    );
    const plaintext = xsalsa20(keySecretBytes, nOnce, ciphertext);

    return textDecoder.decode(plaintext) as Stringified<T>;
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
    const nOnce = this.generateJsonNonce(nOnceMaterial);

    const sealerPub = base58.decode(to.substring("sealer_z".length));

    const senderPriv = base58.decode(from.substring("sealerSecret_z".length));

    const plaintext = textEncoder.encode(stableStringify(message));

    const sharedSecret = x25519.getSharedSecret(senderPriv, sealerPub);

    const sealedBytes = xsalsa20poly1305(sharedSecret, nOnce).encrypt(
      plaintext,
    );

    return `sealed_U${bytesToBase64url(sealedBytes)}` as Sealed<T>;
  }

  unseal<T extends JsonValue>(
    sealed: Sealed<T>,
    sealer: SealerSecret,
    from: SealerID,
    nOnceMaterial: { in: RawCoID; tx: TransactionID },
  ): T | undefined {
    const nOnce = this.generateJsonNonce(nOnceMaterial);

    const sealerPriv = base58.decode(sealer.substring("sealerSecret_z".length));

    const senderPub = base58.decode(from.substring("sealer_z".length));

    const sealedBytes = base64URLtoBytes(sealed.substring("sealed_U".length));

    const sharedSecret = x25519.getSharedSecret(sealerPriv, senderPub);

    const plaintext = xsalsa20poly1305(sharedSecret, nOnce).decrypt(
      sealedBytes,
    );

    try {
      return JSON.parse(textDecoder.decode(plaintext));
    } catch (e) {
      logger.error("Failed to decrypt/parse sealed message", { err: e });
      return undefined;
    }
  }
}
