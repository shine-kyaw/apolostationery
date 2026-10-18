/* Burmese table. Same keys as en.js; a missing key falls back to English. */
import common from './my/common.js';
import chrome from './my/chrome.js';
import home from './my/home.js';
import shop from './my/shop.js';
import product from './my/product.js';
import info from './my/info.js';

export default { ...common, ...chrome, ...home, ...shop, ...product, ...info };
