import template from './auth-header.html?raw';
import logoUrl from '../../../assets/icons/learnhub-logo.svg?url';

class AuthHeader extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.innerHTML = template.replaceAll('/assets/icons/learnhub-logo.svg', logoUrl);
    this.dataset.rendered = 'true';
  }
}

customElements.define('auth-header', AuthHeader);
