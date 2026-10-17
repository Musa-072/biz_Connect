document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.getElementById('dashboard-sidebar');
  const menuButton = document.getElementById('dashboard-menu-toggle');
  const notice = document.getElementById('dashboard-data-notice');
  const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

  const showStorageIssue = (message) => {
    if (notice) {
      notice.textContent = message;
      notice.className = 'mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900';
    }
  };

  const closeMenu = () => {
    sidebar?.classList.add('-translate-x-full');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open dashboard navigation');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    sidebar?.classList.toggle('-translate-x-full', !isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close dashboard navigation' : 'Open dashboard navigation');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (menuButton?.getAttribute('aria-expanded') === 'true'
      && !sidebar?.contains(event.target)
      && !menuButton.contains(event.target)) closeMenu();
  });
  sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  try {
    const userValue = localStorage.getItem('bizconnect-user');
    if (userValue) {
      const user = JSON.parse(userValue);
      if (user && typeof user.name === 'string' && user.name.trim()) {
        const name = document.getElementById('dashboard-user-name');
        if (name) name.textContent = user.name.trim();
      }
    }
  } catch (error) {
    console.error('Unable to read the saved account name for the dashboard.', error);
  }

  let hasBusinessProfile = false;
  try {
    const business = JSON.parse(localStorage.getItem('bizconnect-business') || 'null');
    hasBusinessProfile = Boolean(business && typeof business.id === 'string' && typeof business.name === 'string');
  } catch (error) {
    console.error('Unable to read the saved business profile for the dashboard.', error);
    showStorageIssue('The saved business profile could not be read. Reopen business setup before managing products.');
  }
  document.querySelectorAll('[data-seller-products]').forEach((link) => {
    link.href = hasBusinessProfile ? '../business/profile.html#add-product' : '../business/onboarding.html';
  });

  try {
    const savedOrders = JSON.parse(localStorage.getItem('bizconnect-demo-orders-v1') || '[]');
    if (!Array.isArray(savedOrders)) throw new TypeError('Saved orders are not a list.');
    const validOrders = savedOrders.filter((order) => (
      order
      && typeof order === 'object'
      && Number.isFinite(Number(order.total))
      && Number(order.total) >= 0
    ));
    const orderValue = validOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const valueElement = document.getElementById('dashboard-order-value');
    const countElement = document.getElementById('dashboard-order-count');
    if (valueElement) valueElement.textContent = currency.format(orderValue);
    if (countElement) countElement.textContent = String(validOrders.length);
  } catch (error) {
    console.error('Unable to read saved local orders for the dashboard.', error);
    const valueElement = document.getElementById('dashboard-order-value');
    const countElement = document.getElementById('dashboard-order-count');
    if (valueElement) valueElement.textContent = 'Unavailable';
    if (countElement) countElement.textContent = 'Unavailable';
    showStorageIssue('Saved order data could not be read. Order totals are unavailable; no payments are processed here.');
  }

  try {
    const response = await fetch('../shop/products.html');
    if (!response.ok) throw new Error(`Catalogue request failed with status ${response.status}.`);
    const catalogMarkup = await response.text();
    const catalogDocument = new DOMParser().parseFromString(catalogMarkup, 'text/html');
    const catalogProducts = [...catalogDocument.querySelectorAll('.bc-product-grid article.group')];
    const savedProductsValue = localStorage.getItem('bizconnect-owner-products-v1');
    const savedProducts = savedProductsValue ? JSON.parse(savedProductsValue) : [];
    if (!Array.isArray(savedProducts)) throw new TypeError('Saved products are not a list.');
    const validSavedProducts = savedProducts.filter((product) => (
      product
      && typeof product === 'object'
      && typeof product.name === 'string'
      && Number.isFinite(Number(product.price))
      && Number(product.price) > 0
    ));
    const count = catalogProducts.length + validSavedProducts.length;
    const productExamples = [
      ...catalogProducts.map((product) => product.querySelector('h3')?.textContent.trim()),
      ...validSavedProducts.map((product) => product.name.trim())
    ].filter(Boolean).slice(0, 3);
    const productCount = document.getElementById('dashboard-product-count');
    const productNote = document.getElementById('dashboard-product-note');
    if (productCount) productCount.textContent = String(count);
    if (productNote && productExamples.length) productNote.textContent = productExamples.join(' · ');
  } catch (error) {
    console.error('Unable to count marketplace catalogue products for the dashboard.', error);
    const productCount = document.getElementById('dashboard-product-count');
    if (productCount) productCount.textContent = 'Unavailable';
    showStorageIssue('Catalogue totals could not be loaded. Dashboard data is limited to this browser and payment processing is not available.');
  }
});
