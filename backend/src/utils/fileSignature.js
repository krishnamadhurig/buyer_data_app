const XLS_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

function matchesSignature(ext, buf) {
  if (ext === '.xlsx') {
    return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  }
  if (ext === '.xls') {
    return buf.length > 8 && buf.subarray(0, 8).equals(XLS_SIGNATURE);
  }
  if (ext === '.csv') {
    return buf.length > 0 && !buf.subarray(0, 1024).includes(0);
  }
  return false;
}

module.exports = { matchesSignature };