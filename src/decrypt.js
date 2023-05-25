import crypto from "node:crypto";

/**
 * Decrypts a given payload using an initialization vector (IV), key and an authentication tag.
 * It uses AES-256-GCM, which is a block cipher mode of operation providing confidentiality and authentication.
 *
 * @param {Buffer} iv - The initialization vector.
 * @param {Buffer} key - The decryption key.
 * @param {Buffer} encryptedData - The encrypted data.
 * @param {Buffer} tag - The authentication tag.
 * @return {Buffer} The decrypted data.
 */
function decrypt(iv, key, encryptedData, tag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = decipher.update(encryptedData);
  return Buffer.concat([decrypted, decipher.final()]);
}

/**
 * Retrieves the decryption key from an item.
 * The decryption key is base64 encoded, so it is first converted into bytes.
 * It's then separated into the initialization vector (iv), the encrypted data, and the authentication tag.
 * The encrypted data is then decrypted using the provided unlock key and the derived iv and tag.
 *
 * @param {Buffer} unlockKey - The key to unlock the encrypted decryption key.
 * @param {Object} item - The item holding the base64 encoded decryption key.
 * @return {Buffer} The decrypted key.
 */
function getDecryptionKey(unlockKey, item) {
  const decryptionKeyData = Buffer.from(item.decryption_key, "base64");
  const iv = decryptionKeyData.slice(0, 12);
  const encryptedData = decryptionKeyData.slice(12, -16);
  const tag = decryptionKeyData.slice(-16);
  const decryptedKey = decrypt(iv, unlockKey, encryptedData, tag);
  return decryptedKey;
}

/**
 * Retrieves the decryption key for a game.
 *
 * @param {Buffer} unlockKey - The key to unlock the game's decryption key.
 * @param {Object} game - The game object.
 * @return {Buffer} The decrypted key.
 */
export function getGameDecryptionKey(unlockKey, game) {
  return getDecryptionKey(unlockKey, game);
}

/**
 * Retrieves the decryption key for a firmware update.
 *
 * @param {Buffer} unlockKey - The key to unlock the update's decryption key.
 * @param {Object} update - The firmware update object.
 * @return {Buffer} The decrypted key.
 */
export function getFirmwareDecryptionKey(unlockKey, update) {
  return getDecryptionKey(unlockKey, update);
}
