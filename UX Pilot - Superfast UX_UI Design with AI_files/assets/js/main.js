let verificationNoticeAcknowledged = false;
const mainFallbackImage = new URL('../images/brand/local-product-placeholder.svg', document.currentScript.src).href;

document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    image.src = mainFallbackImage;
}, true);

function switchTab(tabId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    
    const targetSection = document.getElementById(tabId);
    const targetNav = document.getElementById('nav-' + tabId);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function acknowledgeVerificationNotice() {
    const statusText = document.getElementById('verification-status');
    const submitBtn = document.getElementById('submitRegBtn');

    if (!statusText || !submitBtn) {
        console.error('Business verification controls are missing from the page.');
        return;
    }

    verificationNoticeAcknowledged = true;
    statusText.style.color = 'var(--success)';
    statusText.textContent = 'You may continue, but your identity has not been verified.';
    submitBtn.disabled = false;
    submitBtn.style.background = 'var(--primary)';
    submitBtn.style.cursor = 'pointer';
}

function handleRegistration(event) {
    event?.preventDefault();
    if (!verificationNoticeAcknowledged) {
        const status = document.getElementById('verification-status');
        if (status) {
            status.textContent = 'Acknowledge the verification notice before saving your profile.';
            status.style.color = 'var(--warning)';
        }
        return false;
    }

    const form = document.getElementById('regForm');
    const notice = form?.querySelector('.notice');
    const name = document.getElementById('bizName')?.value.trim();
    const phone = document.getElementById('bizPhone')?.value.trim();
    const email = document.getElementById('bizEmail')?.value.trim();
    const location = document.getElementById('bizLocation')?.value.trim();
    const category = document.getElementById('bizCategory')?.value.trim();

    if (!form || !name || !phone || !email || !location || !category) {
        if (notice) {
            notice.textContent = 'Complete all required business details before saving.';
            notice.className = 'notice error show';
        }
        return false;
    }

    const business = {
        id: `demo-${Date.now()}`,
        name,
        phone,
        email,
        location: `${location}, Tshwane`,
        category,
        status: 'demo',
        verificationStatus: 'not-verified',
        createdAt: new Date().toISOString()
    };

    try {
        localStorage.setItem('bizconnect-business', JSON.stringify(business));
        const savedUser = JSON.parse(localStorage.getItem('bizconnect-user') || '{}');
        localStorage.setItem('bizconnect-user', JSON.stringify({
            ...savedUser,
            name: savedUser.name || name,
            email,
            role: 'business_owner',
            businessId: business.id
        }));
    } catch (error) {
        console.error('Unable to save the business profile.', error);
        if (notice) {
            notice.textContent = 'Your browser could not save this profile. Enable local storage and try again.';
            notice.className = 'notice error show';
        }
        return false;
    }

    if (notice) {
        notice.textContent = 'Business profile saved on this device. Identity verification is not complete, and this profile is not publicly listed.';
        notice.className = 'notice success show';
    }
    window.setTimeout(() => { window.location.href = '../admin/dashboard.html'; }, 900);
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const directoryForm = document.querySelector('#directory-filters');
  const directoryGrid = document.querySelector('#directory-grid');
  const directoryCards = [...(directoryGrid?.querySelectorAll('.bc-business-card') || [])];
  if (directoryForm && directoryGrid && directoryCards.length) {
    const searchInput = directoryForm.querySelector('#business-search');
    const categorySelect = directoryForm.querySelector('#business-category');
    const sortSelect = document.querySelector('#business-sort');
    const count = document.querySelector('#directory-count');
    const emptyState = document.querySelector('#directory-empty');
    const initialOrder = new Map(directoryCards.map((card, index) => [card, index]));
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

    const applyDirectoryFilters = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      const category = categorySelect?.value || 'all';
      const visibleCards = directoryCards.filter((card) => {
        const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
        const matchesCategory = category === 'all' || card.dataset.category === category;
        return matchesSearch && matchesCategory;
      });
      const sort = sortSelect?.value || 'featured';
      if (sort === 'name-asc') {
        visibleCards.sort((a, b) => collator.compare(
          a.querySelector('.bc-business-name')?.textContent || '',
          b.querySelector('.bc-business-name')?.textContent || ''
        ));
      } else if (sort === 'name-desc') {
        visibleCards.sort((a, b) => collator.compare(
          b.querySelector('.bc-business-name')?.textContent || '',
          a.querySelector('.bc-business-name')?.textContent || ''
        ));
      } else {
        visibleCards.sort((a, b) => initialOrder.get(a) - initialOrder.get(b));
      }

      const visibleSet = new Set(visibleCards);
      directoryCards.forEach((card) => { card.hidden = !visibleSet.has(card); });
      visibleCards.forEach((card) => directoryGrid.append(card));
      if (count) count.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? 'business' : 'businesses'}`;
      if (emptyState) emptyState.hidden = visibleCards.length !== 0;
    };

    directoryForm.addEventListener('submit', (event) => event.preventDefault());
    directoryForm.addEventListener('input', applyDirectoryFilters);
    directoryForm.addEventListener('change', applyDirectoryFilters);
    sortSelect?.addEventListener('change', applyDirectoryFilters);
    document.querySelector('#clear-directory-filters')?.addEventListener('click', () => {
      directoryForm.reset();
      if (sortSelect) sortSelect.value = 'featured';
      applyDirectoryFilters();
    });

    const filterToggle = document.querySelector('#mobile-directory-filters');
    filterToggle?.addEventListener('click', () => {
      const open = directoryForm.classList.toggle('is-open');
      filterToggle.setAttribute('aria-expanded', String(open));
      filterToggle.textContent = open ? 'Hide filters' : 'Filters';
    });
    applyDirectoryFilters();
  }

  const setNotice = (form, message, type) => {
    const notice = form.querySelector('.notice');
    if (!notice) return;
    notice.textContent = message;
    notice.className = `notice ${type} show`;
  };

  const showSuccessAndRedirect = (form, target, message) => {
    setNotice(form, message, 'success');
    setTimeout(() => {
      window.location.href = target;
    }, 600);
  };

  const publicPage = (page) => {
    if (window.location.pathname.includes('/account/') || window.location.pathname.includes('/business/')) {
      return `../public/${page}`;
    }
    return page;
  };

  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      let invalid = false;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          invalid = true;
          input.setAttribute('aria-invalid', 'true');
        } else {
          input.setAttribute('aria-invalid', 'false');
        }
      });

      if (invalid) {
        event.preventDefault();
        setNotice(form, 'Please complete all required fields before continuing.', 'error');
        return;
      }

      const formId = form.id || form.querySelector('input, select, textarea')?.id || 'form';
      if (formId.includes('signup')) {
        event.preventDefault();
        const name = document.getElementById('signup-first-name')?.value?.trim() || 'BizConnect customer';
        const lastName = document.getElementById('signup-last-name')?.value?.trim() || '';
        const email = document.getElementById('signup-email')?.value?.trim() || 'customer@example.com';
        const password = document.getElementById('signup-password')?.value || '';
        const roleValue = document.getElementById('signup-role')?.value?.toLowerCase() || 'customer';
        const role = roleValue.includes('business') ? 'business_owner' : 'customer';
        const supabase = window.BizConnectSupabase;
        if (supabase?.isConfigured) {
          const result = await supabase.signUp({ email, password, fullName: `${name} ${lastName}`.trim(), role });
          if (result.error) {
            setNotice(form, result.error.message, 'error');
            return;
          }
          const target = role === 'business_owner'
            ? '../business/onboarding.html'
            : publicPage('marketplace.html');
          const message = result.data?.session
            ? 'Account created. Continuing setup...'
            : 'Account created. Check your email to confirm your account.';
          setNotice(form, message, 'success');
          if (result.data?.session) setTimeout(() => { window.location.href = target; }, 600);
          return;
        }
        localStorage.setItem('bizconnect-user', JSON.stringify({ name, email, role }));
        const target = role.includes('business') ? '../business/onboarding.html' : publicPage('marketplace.html');
        const message = role.includes('business')
          ? 'Account created. Setting up your business profile...'
          : 'Account created. Redirecting to the marketplace...';
        showSuccessAndRedirect(form, target, message);
      }

      if (formId.includes('login')) {
        event.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim() || 'customer@example.com';
        const password = document.getElementById('login-password')?.value || '';
        const supabase = window.BizConnectSupabase;
        if (supabase?.isConfigured) {
          const result = await supabase.signIn({ email, password });
          if (result.error) {
            setNotice(form, result.error.message, 'error');
            return;
          }
          showSuccessAndRedirect(form, '../admin/dashboard.html', 'Login successful. Redirecting...');
          return;
        }
        const name = email.split('@')[0] || 'BizConnect user';
        let savedUser = {};
        try {
          const parsedUser = JSON.parse(localStorage.getItem('bizconnect-user') || '{}');
          if (parsedUser && typeof parsedUser === 'object' && !Array.isArray(parsedUser)) savedUser = parsedUser;
          const isSameUser = savedUser.email?.toLowerCase() === email.toLowerCase();
          const role = isSameUser ? savedUser.role || 'customer' : 'customer';
          localStorage.setItem('bizconnect-user', JSON.stringify({
            ...savedUser,
            name: isSameUser ? savedUser.name || name : name,
            email,
            role
          }));
        } catch (error) {
          console.error('Unable to load or save the account.', error);
          setNotice(form, 'Your browser could not load or save the account. Enable local storage and try again.', 'error');
          return;
        }
        showSuccessAndRedirect(form, '../admin/dashboard.html', 'Login successful. Redirecting...');
      }

      if (formId.includes('business')) {
        event.preventDefault();
        const businessName = document.getElementById('business-name')?.value?.trim() || 'Your business';
        const supabase = window.BizConnectSupabase;
        if (supabase?.isConfigured) {
          const result = await supabase.createBusiness({
            name: businessName,
            category: document.getElementById('business-category')?.value || 'Other',
            location: document.getElementById('business-location')?.value?.trim() || '',
            description: document.getElementById('business-description')?.value?.trim() || ''
          });
          if (result.error) {
            setNotice(form, result.error.message, 'error');
            return;
          }
          showSuccessAndRedirect(form, publicPage('marketplace.html'), `Business profile ready for ${businessName}. Redirecting...`);
          return;
        }
        const user = JSON.parse(localStorage.getItem('bizconnect-user') || '{}');
        const payload = { ...user, businessName, onboardingComplete: true };
        localStorage.setItem('bizconnect-user', JSON.stringify(payload));
        showSuccessAndRedirect(form, publicPage('marketplace.html'), `Business profile ready for ${businessName}. Redirecting...`);
      }

      if (formId.includes('contact')) {
        event.preventDefault();
        setNotice(form, 'Messages cannot be sent from this page yet.', 'error');
      }
    });
  });

  if (document.body.dataset.page === 'catalog') {
    const filterForm = document.querySelector('#catalog-filters');
    const cards = [...document.querySelectorAll('.product-card')];

    const applyFilters = () => {
      const search = (document.querySelector('#search-input')?.value || '').toLowerCase().trim();
      const category = document.querySelector('#category-filter')?.value || 'all';
      const maxPrice = Number(document.querySelector('#price-filter')?.value || 9999);

      let visibleCount = 0;

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const price = Number((card.dataset.price || '0').replace(/[^\d.]/g, ''));
        const productCategory = (card.dataset.category || '').toLowerCase();
        const matchesSearch = !search || text.includes(search);
        const matchesCategory = category === 'all' || productCategory === category;
        const matchesPrice = price <= maxPrice;
        const visible = matchesSearch && matchesCategory && matchesPrice;

        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      const count = document.querySelector('#catalog-count');
      if (count) count.textContent = `${visibleCount} ${visibleCount === 1 ? 'product' : 'products'}`;
      const emptyState = document.querySelector('#empty-state');
      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    };

    filterForm?.addEventListener('input', applyFilters);
    filterForm?.addEventListener('change', applyFilters);
    document.querySelector('#clear-filters')?.addEventListener('click', () => {
      filterForm.reset();
      applyFilters();
    });
  }
});