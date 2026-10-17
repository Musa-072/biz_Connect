document.addEventListener('DOMContentLoaded', () => {
  const profileKey = 'bizconnect-following-business-preview';
  const tabNav = document.querySelector('#business-header')?.nextElementSibling?.querySelector('.border-b');
  const productGrid = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-3');
  const filterRow = productGrid?.previousElementSibling;
  const reviews = document.querySelector('#reviews-preview');
  const tabs = tabNav ? [...tabNav.querySelectorAll('button')] : [];
  const filters = filterRow ? [...filterRow.querySelectorAll('button')] : [];
  const products = productGrid ? [...productGrid.querySelectorAll('article')] : [];
  const followButton = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Follow'));
  const messageButton = [...document.querySelectorAll('button')].find((button) => button.textContent.includes('Message'));
  const fallbackImage = new URL('../../assets/images/brand/local-product-placeholder.svg', window.location.href).href;
  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  let business = null;
  let storageError = false;
  try {
    const stored = JSON.parse(localStorage.getItem('bizconnect-business') || 'null');
    if (stored && typeof stored === 'object' && stored.name && stored.id) business = stored;
  } catch (error) {
    storageError = true;
    console.error('Unable to load the saved business profile.', error);
  }

  const header = document.querySelector('#business-header');
  const title = header?.querySelector('h1');
  if (title) title.textContent = business?.name || 'Soshanguve Local Bakery';
  const status = title?.parentElement?.querySelector('span');
  if (status) {
    status.textContent = 'Identity not verified';
    status.className = 'inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold';
  }
  const location = [...(header?.querySelectorAll('span') || [])].find((span) => /Soshanguve|Block/i.test(span.textContent));
  const profileSummary = location?.parentElement;
  if (profileSummary) profileSummary.replaceChildren(location);
  if (location) {
    const locationText = [...location.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (locationText) locationText.textContent = ` ${business?.location || 'Soshanguve Block H, Tshwane'}`;
  }
  header?.querySelector('.text-yellow-500')?.remove();
  const description = header?.querySelector('p.leading-relaxed');
  if (description) {
    description.textContent = business
      ? `${business.name} is saved on this device. It has not been verified or published.`
      : 'A neighbourhood business serving Soshanguve. Contact the seller to confirm current products, prices, and opening hours.';
  }
  const tags = description?.nextElementSibling;
  if (tags) {
    tags.replaceChildren(
      createElement('span', 'px-3 py-1 rounded-full bg-brand-light text-xs font-medium text-neutral-600', business?.category || 'Bakery'),
      createElement('span', 'px-3 py-1 rounded-full bg-brand-light text-xs font-medium text-neutral-600', business ? 'Saved on this device' : 'Soshanguve business'),
      createElement('span', 'px-3 py-1 rounded-full bg-brand-light text-xs font-medium text-neutral-600', 'Soshanguve, Tshwane')
    );
  }
  if (business) {
    const cover = document.querySelector('#business-cover img');
    const avatar = header?.querySelector('img');
    if (cover) {
      cover.src = fallbackImage;
      cover.alt = 'Local Soshanguve business image placeholder';
    }
    if (avatar) {
      avatar.src = fallbackImage;
      avatar.alt = 'Local business image placeholder';
    }
  }

  const businessInfo = [...document.querySelectorAll('main h3')]
    .find((heading) => heading.textContent.trim() === 'Business info')?.parentElement;
  businessInfo?.querySelectorAll('li').forEach((item) => {
    if (/\b021\b|@karoocrumb/i.test(item.textContent)) item.remove();
  });
  const verificationHeading = [...document.querySelectorAll('main h3')]
    .find((heading) => heading.textContent.trim() === 'Verified business');
  if (verificationHeading) verificationHeading.textContent = 'Identity not verified';
  document.querySelectorAll('main .text-yellow-500').forEach((rating) => rating.remove());
  reviews?.setAttribute('hidden', '');
  const reviewTab = tabs.find((tab) => /^reviews/i.test(tab.textContent.trim()));
  if (reviewTab) {
    reviewTab.hidden = true;
    reviewTab.classList.add('hidden');
    reviewTab.setAttribute('aria-hidden', 'true');
  }
  const productTab = tabs.find((tab) => /^products/i.test(tab.textContent.trim()));
  if (productTab) productTab.textContent = `Products (${products.length})`;

  if (business) {
    const content = header?.nextElementSibling;
    if (content) {
      content.hidden = true;
      content.style.display = 'none';
    }
    const ownerPanel = createElement('section', 'max-w-4xl mx-auto px-4 lg:px-8 py-8');
    ownerPanel.id = 'seller-products';
    ownerPanel.append(
      createElement('h2', 'text-2xl font-bold mb-2', 'Your local business profile'),
      createElement('p', 'text-sm text-neutral-600 mb-2', 'This profile and its products are saved only in this browser. Identity verification, public listings, and order processing are not available yet.'),
      createElement('p', 'text-sm text-neutral-600 mb-6', `${business.category} · ${business.location}`)
    );
    if (storageError) {
      ownerPanel.append(createElement('p', 'notice error show', 'The saved profile could not be read. Enable local storage and refresh this page.'));
    } else {
      const productForm = createElement('form', 'bg-white border border-neutral-200 rounded-xl p-5 space-y-4');
      productForm.id = 'add-product';
      productForm.style.scrollMarginTop = '6rem';
      const formTitle = createElement('h3', 'text-lg font-semibold', 'Add a product');
      const nameLabel = createElement('label', 'block text-sm font-medium', 'Product name');
      const nameInput = createElement('input', 'mt-1 w-full px-3 py-2.5 rounded-lg border border-neutral-200');
      nameInput.name = 'product-name';
      nameInput.required = true;
      nameInput.maxLength = 80;
      nameInput.placeholder = 'e.g. Handmade beaded keyring';
      nameLabel.append(nameInput);
      const priceLabel = createElement('label', 'block text-sm font-medium', 'Price (ZAR)');
      const priceInput = createElement('input', 'mt-1 w-full px-3 py-2.5 rounded-lg border border-neutral-200');
      priceInput.name = 'product-price';
      priceInput.type = 'number';
      priceInput.min = '0.01';
      priceInput.step = '0.01';
      priceInput.required = true;
      priceLabel.append(priceInput);
      const categoryLabel = createElement('label', 'block text-sm font-medium', 'Product category');
      const categoryInput = createElement('select', 'mt-1 w-full px-3 py-2.5 rounded-lg border border-neutral-200');
      categoryInput.name = 'product-category';
      [
        ['food & beverage', 'Food & Beverage'],
        ['fashion & textiles', 'Fashion & Textiles'],
        ['home & crafts', 'Home & Crafts'],
        ['beauty & wellness', 'Beauty & Wellness'],
        ['agriculture', 'Agriculture'],
        ['services', 'Services']
      ].forEach(([value, label]) => {
        const option = createElement('option', '', label);
        option.value = value;
        categoryInput.append(option);
      });
      categoryLabel.append(categoryInput);
      const imageLabel = createElement('label', 'block text-sm font-medium', 'Product photo (optional, up to 2 MB)');
      const imageInput = createElement('input', 'mt-1 block w-full text-sm');
      imageInput.name = 'product-image';
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      imageLabel.append(imageInput);
      const submit = createElement('button', 'px-5 py-2.5 rounded-lg bg-brand-primary text-white font-semibold', 'Save product');
      submit.type = 'submit';
      const formStatus = createElement('p', 'text-sm', '');
      formStatus.setAttribute('role', 'status');
      formStatus.setAttribute('aria-live', 'polite');
      formStatus.dataset.productStatus = '';
      productForm.append(formTitle, nameLabel, priceLabel, categoryLabel, imageLabel, submit, formStatus);
      const productListHeading = createElement('h3', 'text-lg font-semibold mt-8 mb-3', 'Your products');
      const productList = createElement('div', 'space-y-3');
      const storageKey = 'bizconnect-owner-products-v1';

      const readProducts = () => {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
          return Array.isArray(saved) ? saved.filter((item) => item?.id && item.businessId) : [];
        } catch (error) {
          console.error('Unable to read saved products.', error);
          formStatus.textContent = 'Saved products could not be read. Clear this site’s stored product data and try again.';
          formStatus.className = 'notice error show';
          return [];
        }
      };

      const renderProducts = () => {
        const saved = readProducts().filter((item) => item.businessId === business.id);
        productList.replaceChildren();
        if (!saved.length) {
          productList.append(createElement('p', 'text-sm text-neutral-500', 'No products added yet.'));
          return;
        }
        saved.forEach((item) => {
          const row = createElement('div', 'flex items-center gap-3 bg-white border border-neutral-200 rounded-xl p-3');
          const image = createElement('img', 'w-16 h-16 rounded-lg object-cover');
          image.src = item.image || fallbackImage;
          image.alt = item.alt || item.name;
          const details = createElement('div', 'flex-1 min-w-0');
          details.append(
            createElement('p', 'font-medium truncate', item.name),
            createElement('p', 'text-sm text-neutral-500', `${item.category} · ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(item.price)}`)
          );
          const remove = createElement('button', 'text-sm text-red-700 underline', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label', `Remove ${item.name}`);
          remove.addEventListener('click', () => {
            const updated = readProducts().filter((entry) => entry.id !== item.id);
            try {
              localStorage.setItem(storageKey, JSON.stringify(updated));
              renderProducts();
              formStatus.textContent = 'Product removed.';
              formStatus.className = 'text-sm text-green-700';
            } catch (error) {
              console.error('Unable to remove the product.', error);
              formStatus.textContent = 'Your browser could not update this product. Check available storage and try again.';
              formStatus.className = 'notice error show';
            }
          });
          row.append(image, details, remove);
          productList.append(row);
        });
      };

      productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const price = Number(priceInput.value);
        const file = imageInput.files?.[0];
        if (!name || !Number.isFinite(price) || price <= 0) {
          formStatus.textContent = 'Enter a product name and a price greater than zero.';
          formStatus.className = 'notice error show';
          return;
        }
        if (file && (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024)) {
          formStatus.textContent = 'Choose an image file smaller than 2 MB.';
          formStatus.className = 'notice error show';
          return;
        }
        const saveProduct = (image) => {
          const saved = readProducts();
          const product = {
            id: `demo-${business.id}-${Date.now().toString(36)}`,
            businessId: business.id,
            name,
            seller: business.name,
            price,
            image,
            alt: name,
            category: categoryInput.value,
            location: business.location
          };
          try {
            localStorage.setItem(storageKey, JSON.stringify([...saved, product]));
            productForm.reset();
            formStatus.textContent = 'Product saved on this device. It will appear in your local marketplace.';
            formStatus.className = 'text-sm text-green-700';
            renderProducts();
          } catch (error) {
            console.error('Unable to save the product.', error);
            formStatus.textContent = 'Your browser could not save this product. Try a smaller image or check available storage.';
            formStatus.className = 'notice error show';
          }
        };
        if (!file) {
          saveProduct(fallbackImage);
          return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          if (typeof reader.result === 'string') saveProduct(reader.result);
          else {
            formStatus.textContent = 'The selected image could not be read.';
            formStatus.className = 'notice error show';
          }
        });
        reader.addEventListener('error', () => {
          console.error('Unable to read the selected product image.', reader.error);
          formStatus.textContent = 'The selected image could not be read.';
          formStatus.className = 'notice error show';
        });
        reader.readAsDataURL(file);
      });
      ownerPanel.append(productForm, productListHeading, productList);
      content?.after(ownerPanel);
      if (window.location.hash === '#add-product') {
        productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus({ preventScroll: true });
      }
      renderProducts();
    }
    followButton?.closest('div.flex.items-center.gap-3')?.remove();
  } else {
    const reviewDetails = reviews?.closest('section');
    if (reviewDetails) {
      reviewDetails.hidden = true;
      reviewDetails.style.display = 'none';
    }
    const actionStatus = createElement('p', 'text-xs text-neutral-500', 'Contact and follow services are not available yet.');
    messageButton?.closest('div.flex.items-center.gap-3')?.replaceWith(actionStatus);
  }

  const setActive = (buttons, activeButton) => {
    buttons.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle('bg-brand-primary', active);
      button.classList.toggle('text-white', active);
      button.classList.toggle('border-brand-primary', active);
      button.classList.toggle('text-brand-primary', active);
      button.setAttribute('aria-selected', String(active));
    });
  };

  const showTab = (tabButton, index) => {
    setActive(tabs, tabButton);
    const tabName = tabButton.textContent.trim().toLowerCase();
    const showProducts = tabName.startsWith('products');
    const showReviews = tabName.startsWith('reviews');

    if (productGrid) {
      productGrid.hidden = !showProducts;
      productGrid.style.display = showProducts ? '' : 'none';
    }
    if (filterRow) {
      filterRow.hidden = !showProducts;
      filterRow.style.display = showProducts ? '' : 'none';
    }
    if (reviews) {
      reviews.hidden = !showProducts && !showReviews;
      reviews.style.display = showReviews ? '' : 'none';
    }

    let panel = document.querySelector('#business-tab-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'business-tab-panel';
      panel.className = 'bg-brand-light border border-neutral-200 rounded-xl p-6 mb-8 text-sm text-neutral-600';
      productGrid?.before(panel);
    }

    if (showProducts || showReviews) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    panel.textContent = index === 1
      ? 'This neighbourhood business serves customers in Soshanguve. Contact the seller for current products and opening hours.'
      : 'Arrange collection in Soshanguve or confirm local delivery directly with the seller.';
  };

  tabs.forEach((tab, index) => {
    tab.type = 'button';
    tab.addEventListener('click', () => showTab(tab, index));
  });

  const matchesFilter = (article, filterName) => {
    if (filterName === 'all') return true;
    const title = article.querySelector('h3')?.textContent.toLowerCase() || '';
    if (filterName === 'bread') return /loaf|rusk/.test(title);
    if (filterName === 'pastries') return /croissant|pudding/.test(title);
    return /rooibos|tea/.test(title);
  };

  filters.forEach((filter) => {
    filter.type = 'button';
    filter.addEventListener('click', () => {
      const filterName = filter.textContent.trim().toLowerCase();
      setActive(filters, filter);
      products.forEach((product) => {
        product.hidden = !matchesFilter(product, filterName);
      });
    });
  });

  if (followButton && business) {
    const updateFollowState = (following) => {
      followButton.innerHTML = following ? 'Following' : 'Follow';
      followButton.setAttribute('aria-pressed', String(following));
      followButton.classList.toggle('bg-brand-primary', following);
      followButton.classList.toggle('text-white', following);
    };

    updateFollowState(localStorage.getItem(profileKey) === 'true');
    followButton.addEventListener('click', () => {
      const following = localStorage.getItem(profileKey) !== 'true';
      localStorage.setItem(profileKey, String(following));
      updateFollowState(following);
    });
  }

  messageButton?.addEventListener('click', () => {
    window.location.href = '../public/contact.html';
  });

  if (tabs[0]) showTab(tabs[0], 0);
  if (filters[0]) setActive(filters, filters[0]);
});
