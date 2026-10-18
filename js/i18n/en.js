/* English table = the source of truth. Every key used anywhere in the site
   exists here; js/i18n/my.js must have the same keys. One file per area of
   the site so people can work on them side by side. */
import common from './en/common.js';
import chrome from './en/chrome.js';
import home from './en/home.js';
import shop from './en/shop.js';
import product from './en/product.js';
import info from './en/info.js';

export default { ...common, ...chrome, ...home, ...shop, ...product, ...info };
