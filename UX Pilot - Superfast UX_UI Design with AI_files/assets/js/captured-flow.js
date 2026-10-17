document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop();
  const publicPage = (name) => path.includes('/public/') ? `../public/${name}` : `../public/${name}`;
  const navigate = (target) => { window.location.href = target; };
  const cartPath = path.includes('/shop/') ? 'cart.html' : '../shop/cart.html';

  const attachHeaderActions = () => {
    const header = document.querySelector('header');
    const nav = header?.querySelector('nav');
    const menuButton = header?.querySelector('button[class~="md:hidden"]');

    if (nav && menuButton) {
      nav.classList.add('bc-mobile-nav');
      nav.id ||= 'bc-primary-navigation';
      menuButton.setAttribute('aria-label', 'Toggle navigation');
      menuButton.setAttribute('aria-controls', nav.id);
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        menuButton.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }));
    }

    document.querySelectorAll('button').forEach((button) => {
      const text = button.textContent.trim().toLowerCase();
      const icon = button.querySelector('[data-icon]')?.getAttribute('data-icon');
      if (text.includes('sell on bizconnect')) {
        button.addEventListener('click', () => navigate('../business/onboarding.html'));
      } else if (icon === 'cart-shopping') {
        button.setAttribute('aria-label', 'Shopping cart');
        button.addEventListener('click', () => navigate(cartPath));
      } else if (icon === 'user') {
        button.setAttribute('aria-label', 'Account and sign in');
        button.addEventListener('click', () => navigate('../account/login.html'));
      }
    });
  };

  const setupFooterNavigation = () => {
    const routes = {
      'BizConnect': ['../public/home.html', 'BizConnect'],
      'Browse products': ['../shop/products.html', 'Browse products'],
      'Categories': ['../shop/products.html#categories', 'Categories'],
      'Deals': ['../shop/products.html#deals', 'Deals'],
      'Gift cards': ['../shop/cart.html', 'Shopping cart'],
      'Start selling': ['../business/onboarding.html', 'Start selling'],
      'Seller resources': ['../business/profile.html', 'Business profile'],
      'Fees': ['../public/contact.html', 'Ask about fees'],
      'Success stories': ['../public/businesses.html', 'Business directory'],
      'About us': ['../public/about.html', 'About us'],
      'Careers': ['../public/businesses.html', 'Businesses'],
      'Contact': ['../public/contact.html', 'Contact'],
      'Press': ['../account/login.html', 'Sign in'],
    };

    document.querySelectorAll('body > footer a').forEach((link) => {
      const label = link.textContent.trim();
      if (routes[label]) {
        const [href, text] = routes[label];
        link.href = href;
        if (text !== label) link.textContent = text;
      } else if (label === 'Privacy Policy' || label === 'Terms of Service') {
        link.textContent = `${label} (not available)`;
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('title', 'This legal page is not available yet.');
        link.tabIndex = -1;
      } else if (!label && link.querySelector('svg')) {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('title', 'Social profile link is not configured.');
        link.tabIndex = -1;
      }
    });
  };

  const setupHomeSearch = () => {
    const input = document.querySelector('input[placeholder="What are you looking for today?"]');
    input?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const query = encodeURIComponent(input.value.trim());
      navigate(`../shop/products.html${query ? `?search=${query}` : ''}`);
    });

    const newsletterForm = [...document.querySelectorAll('form')].find((form) => form.textContent.includes('Subscribe'));
    newsletterForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"], input[type="text"]');
      const button = newsletterForm.querySelector('button');
      if (!email?.value.trim()) return;
      button.textContent = 'Subscribed';
      button.disabled = true;
      email.value = '';
      email.placeholder = 'You are on the list';
    });
  };

  const setupProductListing = () => {
    const sidebar = document.querySelector('#filters-sidebar');
    const toggle = document.querySelector('#mobile-filters-btn');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-controls', 'filters-sidebar');
    toggle?.addEventListener('click', () => {
      const open = sidebar?.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(open));
    });
  };

  const setupProductDetails = () => {
    const tabs = [...document.querySelectorAll('button')].filter((button) => /Description|Specifications|Reviews|Shipping/.test(button.textContent));
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('border-brand-primary', 'text-brand-primary'));
      tab.classList.add('border-brand-primary', 'text-brand-primary');
    }));
  };

  attachHeaderActions();
  setupFooterNavigation();
  if (page === 'home.html') setupHomeSearch();
  if (page === 'products.html') setupProductListing();
  if (page === 'product-details.html') setupProductDetails();
});
