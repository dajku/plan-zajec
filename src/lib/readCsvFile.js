// Reads a File as text. The faculty export is UTF-8 with a BOM, but older
// Excel exports can be Windows-1250; fall back to that when UTF-8 decoding
// produces replacement characters.

export async function readCsvFile(file) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes(String.fromCharCode(0xfffd))) return utf8;
  try {
    return new TextDecoder('windows-1250').decode(buffer);
  } catch {
    return utf8;
  }
}
