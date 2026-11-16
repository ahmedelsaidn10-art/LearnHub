import './components/header/site-header.js';
import './components/footer/site-footer.js';
import './components/auth-header/auth-header.js';
import './components/theme-toggle/theme-toggle.js';
import './components/mobile-navigation/mobile-navigation.js';

const pageModules = import.meta.glob('./pages/*.js');
const pageName = document.body.dataset.page;
const loadPage = pageModules[`./pages/${pageName}.js`];

if (loadPage) {
  loadPage().then(({ init }) => init?.());
}
