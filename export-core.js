const _ = require('lodash');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const PDFMerger = require('pdf-merger-js');

const cachePath = (() => {
  if (process.env.XDG_CACHE_HOME)
    return path.join(process.env.XDG_CACHE_HOME, 'draw.io-export');
  if (process.env.HOME)
    return path.join(process.env.HOME, '.cache', 'draw.io-export');
  return path.join(__dirname, '.cache');
})();

const cacheExists = (t) => new Promise((resolve) => {
  fs.exists(path.join(cachePath, t), resolve);
});

const cacheDict = {
  'https://app.diagrams.net/export3.html': 'export3.html',
  'https://app.diagrams.net/js/app.min.js': 'app.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_HTMLorMML': 'MathJax.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/config/TeX-MML-AM_HTMLorMML.js?V=2.7.5': 'TeX-MML-AM_HTMLorMML.js',
  'https://cdn.mathjax.org/mathjax/contrib/a11y/accessibility-menu.js?V=2.7.5': 'accessibility-menu.js',
};

const cache = async (f, t) => {
  if (await cacheExists(t)) {
    return;
  }
  const response = await axios.get(f, {
    responseType: 'stream',
  });
  shelljs.mkdir('-p', path.join(cachePath, path.dirname(t)));
  response.data.pipe(fs.createWriteStream(path.join(cachePath, t)));
  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve();
    });
    response.data.on('error', () => {
      reject();
    });
  });
};

module.exports = async (fullXml, format = 'png', options = {}) => {
  const { scale = 1, border = 0 } = options;

  await Promise.all(_.toPairs(cacheDict).map(([f, t]) => cache(f, t)));

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (interceptedRequest) => {
      const t = cacheDict[interceptedRequest.url()];
      if (t) {
        fs.readFile(path.join(cachePath, t), (err, res) => {
          if (err) {
            interceptedRequest.abort();
          } else {
            interceptedRequest.respond({
              status: 200,
              body: res,
            });
          }
        });
      } else {
        interceptedRequest.continue();
      }
    });

    await page.goto('https://www.draw.io/export3.html', { waitUntil: 'networkidle0' });

    await page.evaluate((obj) => doc = mxUtils.parseXml(obj), fullXml);
    const pages = +await page.evaluate(() => doc.documentElement.getAttribute('pages') || 1);

    const gen = async (fmt) => {
      await page.evaluate((obj) => {
        const dup = doc.documentElement.cloneNode(false);
        while (true) {
          const n = doc.documentElement.firstChild;
          dup.appendChild(n);
          if (n.nodeType === Node.ELEMENT_NODE)
            break;
        }
        obj.xml = dup.outerHTML;
        render(obj);
      }, {
        format: 'png',
        w: 0,
        h: 0,
        border: border,
        bg: 'none',
        scale: scale,
      });

      await page.waitForSelector('#LoadingComplete');
      const boundsJson = await page.mainFrame().$eval('#LoadingComplete', (div) => div.getAttribute('bounds'));
      const bounds = JSON.parse(boundsJson);

      const fixingScale = 1;
      const w = Math.ceil(bounds.width * fixingScale);
      const h = Math.ceil(bounds.height * fixingScale);

      switch (fmt) {
        case 'png': {
          await page.setViewport({ width: w, height: h });
          const screenshot = await page.screenshot({
            omitBackground: true,
            type: 'png',
            fullPage: true,
          });
          return screenshot;
        }
        case 'pdf': {
          await page.setViewport({ width: w, height: h });
          const pdf = await page.pdf({
            printBackground: false,
            width: `${w}px`,
            height: `${h + 1}px`,
            margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
          });
          return pdf;
        }
        default:
          throw new Error(`Format ${fmt} not allowed, valid options are: png, pdf`);
      }
    };

    const m = format.match(/^(?<prefix>.*-)?(?<core>png|pdf)$/);
    if (!m) {
      throw new Error(`Invalid format: ${format}`);
    }

    const { prefix, core } = m.groups;

    switch (prefix) {
      case undefined: {
        return await gen(core);
      }
      case 'cat-': {
        if (core !== 'pdf') {
          throw new Error('Format not allowed');
        }
        if (pages === 1) {
          return await gen(core);
        } else {
          const merger = new PDFMerger();
          const buffers = [];
          for (let i = 0; i < pages; i++) {
            const buffer = await gen(core);
            buffers.push(buffer);
            merger.add(buffer);
          }
          const mergedPdf = await merger.save();
          return mergedPdf;
        }
      }
      case 'split-':
      case 'split-index-': {
        throw new Error('Split formats not supported in API mode');
      }
      case 'split-id-': {
        throw new Error('Split formats not supported in API mode');
      }
      case 'split-name-': {
        throw new Error('Split formats not supported in API mode');
      }
      default:
        throw new Error(`Format prefix ${prefix} not allowed, valid options are: cat-, split-, split-index-, split-id-, split-name-`);
    }

  } finally {
    await browser.close();
  }
};
