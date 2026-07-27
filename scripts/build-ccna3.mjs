import { build } from "esbuild";
import { readdirSync, unlinkSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const jsDir = "js";
const htmlPath = "ccna3.html";
const oldBundle = /^ccna3\.bundle(-[A-Za-z0-9]+)?\.js$/;

for (const f of readdirSync(jsDir)) {
  if (oldBundle.test(f)) unlinkSync(join(jsDir, f));
}

const result = await build({
  entryPoints: ["ccna3-src/entry.jsx"],
  bundle: true,
  minify: true,
  jsx: "automatic",
  outdir: jsDir,
  entryNames: "ccna3.bundle-[hash]",
  metafile: true,
});

const fileName = Object.keys(result.metafile.outputs)
  .find((f) => f.endsWith(".js"))
  .split(/[\\/]/)
  .pop();

const html = readFileSync(htmlPath, "utf8");
const patched = html.replace(/\/js\/ccna3\.bundle(-[A-Za-z0-9]+)?\.js/, `/js/${fileName}`);
writeFileSync(htmlPath, patched);

console.log("Built js/" + fileName + " and updated " + htmlPath);
