document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('#sidebar');
  const menuButton = document.querySelector('#header button');

  const closeSidebar = () => {
    sidebar?.classList.remove('bc-sidebar-open');
    sidebar?.classList.add('hidden');
    document.body.classList.remove('bc-admin-menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  if (sidebar && menuButton) {
    menuButton.setAttribute('aria-label', 'Toggle admin navigation');
    menuButton.setAttribute('aria-controls', 'sidebar');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', () => {
      const open = !sidebar.classList.contains('bc-sidebar-open');
      sidebar.classList.toggle('bc-sidebar-open', open);
      sidebar.classList.toggle('hidden', !open);
      document.body.classList.toggle('bc-admin-menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (event) => {
      if (document.body.classList.contains('bc-admin-menu-open')
        && !sidebar.contains(event.target)
        && !menuButton.contains(event.target)) closeSidebar();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSidebar();
    });
  }

  const destinations = {
    Overview: 'dashboard.html',
    Businesses: '../public/businesses.html',
    Verification: '#verification',
    Customers: '#customers',
    Products: '../shop/products.html',
    Reports: '#reports',
  };
  const unavailable = new Set(['Orders', 'Payouts', 'Platform settings']);
  sidebar?.querySelectorAll('nav a').forEach((link) => {
    const label = link.textContent.replace(/\d[\d,]*/g, '').trim().replace(/\s+/g, ' ');
    if (destinations[label]) {
      link.setAttribute('href', destinations[label]);
    } else if (unavailable.has(label)) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('title', 'This screen is not available yet.');
      link.classList.add('bc-disabled-nav-item');
      link.tabIndex = -1;
      link.insertAdjacentText('beforeend', ' (not available)');
    }
  });

  document.querySelectorAll('a').forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    if (label === 'review now') link.setAttribute('href', '#verification');
    if (label === 'view all' && link.closest('#verification')) {
      link.setAttribute('href', '#verification');
    }
  });
});
