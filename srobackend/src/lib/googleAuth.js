/**
 * Normalizes a Google service account private key from an environment variable.
 * Handles keys stored with escaped \n sequences, real newlines, or wrapped in
 * surrounding quotes (common when pasting into hosting provider env var UIs).
 */
export function getGoogleServiceAccountKey() {
  let key = process.env.GDRIVE_PRIVATE_KEY;
  if (!key) return key;

  key = key.trim();

  // Strip surrounding quotes if the whole value was wrapped (e.g. '"-----BEGIN...-----"')
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  // Convert escaped newlines to real newlines
  key = key.replace(/\\n/g, '\n');

  return key;
}
