import { writeFile } from "node:fs/promises";
import pngToIco from "png-to-ico";

const files = [16, 24, 32, 48, 64, 128, 256].map((size) => `build/icon-${size}.png`);
const buf = await pngToIco(files);
await writeFile("build/icon.ico", buf);
console.log(`wrote build/icon.ico (${buf.length} bytes)`);
