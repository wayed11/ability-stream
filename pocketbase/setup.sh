#!/bin/bash
set -e

PB_DIR="$(cd "$(dirname "$0")" && pwd)"
PB_BIN="$PB_DIR/pocketbase"
PB_VERSION="0.25.9"

if [ -f "$PB_BIN" ]; then
  echo "PocketBase binary exists"
  exit 0
fi

echo "Downloading PocketBase v${PB_VERSION}..."
cd "$PB_DIR"
curl -L -o pb_temp.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"

echo "Extracting..."

# Try adm-zip first, then try unzip, then try jar
node -e "
try {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip('pb_temp.zip');
  zip.extractAllTo('.', true);
  console.log('Extracted with adm-zip');
} catch(e1) {
  try {
    require('child_process').execSync('unzip -o pb_temp.zip', { stdio: 'inherit' });
    console.log('Extracted with unzip');
  } catch(e2) {
    // Pure Node.js fallback
    const fs = require('fs');
    const zlib = require('zlib');
    const buf = fs.readFileSync('pb_temp.zip');
    // Find central directory end
    let eocdOffset = buf.length - 22;
    while (eocdOffset >= 0 && buf.readUInt32LE(eocdOffset) !== 0x06054b50) eocdOffset--;
    const cdOffset = buf.readUInt32LE(eocdOffset + 16);
    const cdSize = buf.readUInt32LE(eocdOffset + 12);
    let pos = cdOffset;
    while (pos < cdOffset + cdSize) {
      if (buf.readUInt32LE(pos) !== 0x02014b50) break;
      const comp = buf.readUInt16LE(pos + 10);
      const cSize = buf.readUInt32LE(pos + 20);
      const uSize = buf.readUInt32LE(pos + 24);
      const nLen = buf.readUInt16LE(pos + 28);
      const eLen = buf.readUInt16LE(pos + 30);
      const cLen = buf.readUInt16LE(pos + 32);
      const localOff = buf.readUInt32LE(pos + 42);
      const name = buf.slice(pos + 46, pos + 46 + nLen).toString();
      // Read local header
      const lnLen = buf.readUInt16LE(localOff + 26);
      const leLen = buf.readUInt16LE(localOff + 28);
      const dataOff = localOff + 30 + lnLen + leLen;
      const raw = buf.slice(dataOff, dataOff + cSize);
      if (name && !name.endsWith('/')) {
        let data = comp === 8 ? zlib.inflateRawSync(raw) : raw;
        fs.writeFileSync(name, data);
        console.log('Extracted: ' + name);
      }
      pos += 46 + nLen + eLen + cLen;
    }
  }
}
" 2>&1

rm -f pb_temp.zip
chmod +x "$PB_BIN"
"$PB_BIN" --version
echo "PocketBase ready"
