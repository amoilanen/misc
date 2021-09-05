import puppeteer from 'puppeteer'

//ts-node ./html.to.pdf.ts "~/src/src-ext/handsonscala/examples/10.7 - ExtendedBlog/out/dist/dest/post/my-first-post.html" ./temp.pdf

const [src, dest] = process.argv.slice(2);

console.log(src);
console.log(dest);

async function main() {
  let browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("file://" + src, {waitUntil: 'load'});
  await page.pdf({path: dest, format: 'a4'});
}

main().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
