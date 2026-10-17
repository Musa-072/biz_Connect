(() => {
  const CART_KEY = 'bizconnect-cart-v1';
  const CATALOG_KEY = 'bizconnect-catalog-v1';
  const ORDERS_KEY = 'bizconnect-demo-orders-v1';
  const FAVORITES_KEY = 'bizconnect-favorites-v1';
  const OWNER_PRODUCTS_KEY = 'bizconnect-owner-products-v1';
  const PROMO_KEY = 'bizconnect-promo-v1';
  const fallbackImage = new URL('../images/brand/local-product-placeholder.svg', document.currentScript.src).href;
  const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

  const announce = (message, type = 'error') => {
    let notice = document.querySelector('[data-storefront-notice]');
    if (!notice) {
      notice = document.createElement('p');
      notice.dataset.storefrontNotice = '';
      notice.setAttribute('role', 'status');
      notice.className = 'notice';
      document.querySelector('main')?.prepend(notice);
    }
    notice.textContent = message;
    notice.className = `notice ${type} show`;
  };

  const readStored = (key, fallback) => {
    let value;
    try {
      value = localStorage.getItem(key);
    } catch (error) {
      console.error(`Unable to read ${key} from local storage.`, error);
      announce('Your browser blocked local storage. Enable it to save your cart and orders.');
      return fallback;
    }
    if (value === null) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`Stored ${key} data is invalid.`, error);
      announce('Saved marketplace data could not be read. Clear this site’s stored data and try again.');
      return fallback;
    }
  };

  const writeStored = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error);
      announce('Your browser could not save this change. Check available storage and try again.');
      return false;
    }
  };

  const slugify = (value) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const readPrice = (text) => {
    const match = text.match(/R\s*([\d,]+(?:\.\d{1,2})?)/i);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
  };

  const inferCategory = (title) => {
    const value = title.toLowerCase();
    if (/marula|serum|lotion|soap|beauty/.test(value)) return 'beauty & wellness';
    if (/plant|seed|herb|produce|succulent/.test(value)) return 'agriculture';
    if (/tea|bread|loaf|biltong|ginger beer|amasi/.test(value)) return 'food & beverage';
    if (/necklace|leather bag|textile|clothing|bead/.test(value)) return 'fashion & textiles';
    if (/ceramic|basket|cushion/.test(value)) return 'home & crafts';
    if (/service|repair|tutoring/.test(value)) return 'services';
    if (/phone|charger|electronics/.test(value)) return 'electronics';
    return 'other';
  };

  const getProduct = (card) => {
    const title = card.querySelector('h3, h2')?.textContent.trim();
    if (!title) return null;
    const text = card.textContent || '';
    const price = Number(card.dataset.price) || readPrice(text);
    if (!price) return null;
    const image = card.querySelector('img');
    const seller = card.querySelector('[data-seller]')?.textContent.trim()
      || [...card.querySelectorAll('p')].map((p) => p.textContent.trim())
        .find((value) => value && value !== title && !/R\s*[\d,]+/i.test(value))
      || 'Soshanguve local seller';
    return {
      id: card.dataset.productId || slugify(title),
      name: title,
      seller,
      price,
      image: image?.getAttribute('src') || fallbackImage,
      alt: image?.alt || title,
      category: card.dataset.category || inferCategory(title),
      location: 'Soshanguve, Tshwane'
    };
  };

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  if (window.location.pathname.endsWith('/products.html')) {
    const listingGrid = [...document.querySelectorAll('main .grid')].find((grid) => grid.querySelector('article.group'));
    const ownerProducts = readStored(OWNER_PRODUCTS_KEY, []);
    if (listingGrid && Array.isArray(ownerProducts)) {
      ownerProducts.forEach((product) => {
        if (!product?.id || !product.name || !Number.isFinite(product.price) || product.price <= 0) return;
        const card = document.createElement('article');
        card.className = 'group';
        card.dataset.productId = product.id;
        card.dataset.price = String(product.price);
        card.dataset.category = product.category || 'other';

        const imageLink = document.createElement('a');
        imageLink.href = 'product-details.html';
        imageLink.className = 'block relative aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-3';
        const image = document.createElement('img');
        image.src = product.image || fallbackImage;
        image.alt = product.alt || product.name;
        image.className = 'w-full h-full object-cover';
        imageLink.append(image);

        const seller = createElement('p', 'text-xs text-neutral-500 mb-1', product.seller || 'Soshanguve local seller');
        seller.dataset.seller = '';
        const nameLink = document.createElement('a');
        nameLink.href = 'product-details.html';
        const name = createElement('h3', 'text-sm font-medium line-clamp-2 hover:text-brand-primary transition-colors', product.name);
        nameLink.append(name);
        const footer = createElement('div', 'flex items-center justify-between mt-2');
        footer.append(createElement('span', 'text-base font-bold', currency.format(product.price)));
        const addButton = createElement('button', 'px-3 py-2 rounded-lg border border-neutral-200 text-sm font-medium hover:bg-brand-primary hover:text-white transition-colors', 'Add');
        addButton.type = 'button';
        addButton.dataset.productAdd = product.id;
        addButton.setAttribute('aria-label', `Add ${product.name} to cart`);
        footer.append(addButton);
        const location = createElement('p', 'text-xs text-neutral-500 mt-2', product.location || 'Soshanguve, Tshwane');
        card.append(imageLink, seller, nameLink, footer, location);
        listingGrid.append(card);
      });
    }
  }

  const getCatalog = () => {
    const catalog = new Map();
    const saved = readStored(CATALOG_KEY, []);
    if (Array.isArray(saved)) {
      saved.forEach((product) => {
        if (product?.id && product.name && Number.isFinite(product.price)) catalog.set(product.id, product);
      });
    }
    document.querySelectorAll('main article').forEach((card) => {
      const product = getProduct(card);
      if (product) catalog.set(product.id, product);
    });
    writeStored(CATALOG_KEY, [...catalog.values()]);
    return catalog;
  };

  const getCart = () => {
    const cart = readStored(CART_KEY, []);
    if (!Array.isArray(cart)) {
      console.error('Saved marketplace cart is not a list.');
      announce('Your saved cart is invalid. Clear the cart data and try again.');
      return [];
    }
    return cart.filter((item) => item?.id && item.name && Number.isFinite(item.price)
      && Number.isInteger(item.quantity) && item.quantity > 0);
  };

  let catalog = getCatalog();

  const cartQuantity = () => getCart().reduce((total, item) => total + item.quantity, 0);

  const updateCartBadges = () => {
    const count = cartQuantity();
    document.querySelectorAll('a[href$="cart.html"] span').forEach((badge) => {
      if (!badge.classList.contains('absolute')) return;
      badge.textContent = String(count);
      badge.hidden = count === 0;
      badge.setAttribute('aria-label', `${count} ${count === 1 ? 'item' : 'items'} in cart`);
    });
  };

  const setCart = (cart) => {
    if (!writeStored(CART_KEY, cart)) return false;
    updateCartBadges();
    renderCart();
    renderCheckout();
    return true;
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !Number.isFinite(product.price) || product.price <= 0) {
      announce('This product is missing a valid price and could not be added.');
      return false;
    }
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ ...product, quantity });
    const saved = setCart(cart);
    if (saved) announce(`${product.name} added to your cart.`, 'success');
    return saved;
  };

  const renderCart = () => {
    const container = document.querySelector('#cart-items');
    if (!container) return;
    const cart = getCart();
    container.replaceChildren();

    if (!cart.length) {
      const empty = createElement('div', 'bg-white border border-neutral-200 rounded-xl p-8 text-center');
      empty.append(
        createElement('h2', 'text-lg font-bold mb-2', 'Your cart is empty'),
        createElement('p', 'text-sm text-neutral-500 mb-5', 'Find something made or sold by a business in Soshanguve.'),
      );
      const browse = createElement('a', 'inline-flex items-center justify-center px-5 py-3 rounded-lg bg-brand-primary text-white font-semibold', 'Browse local products');
      browse.href = 'products.html';
      empty.append(browse);
      container.append(empty);
    } else {
      cart.forEach((item) => {
        const row = createElement('article', 'bg-white border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center');
        const image = createElement('img', 'w-20 h-20 rounded-lg object-cover flex-shrink-0');
        image.src = item.image || fallbackImage;
        image.alt = item.alt || item.name;
        const detail = createElement('div', 'flex-1 min-w-0');
        detail.append(
          createElement('h2', 'font-semibold', item.name),
          createElement('p', 'text-sm text-neutral-500', `${item.seller} · ${item.location || 'Soshanguve, Tshwane'}`),
          createElement('p', 'text-sm font-semibold mt-2', currency.format(item.price)),
        );
        const controls = createElement('div', 'flex items-center gap-2');
        const decrease = createElement('button', 'w-9 h-9 rounded-lg border border-neutral-200', '−');
        decrease.type = 'button';
        decrease.dataset.cartAction = 'decrease';
        decrease.dataset.productId = item.id;
        decrease.setAttribute('aria-label', `Reduce ${item.name} quantity`);
        const quantity = createElement('span', 'min-w-8 text-center font-medium', String(item.quantity));
        const increase = createElement('button', 'w-9 h-9 rounded-lg border border-neutral-200', '+');
        increase.type = 'button';
        increase.dataset.cartAction = 'increase';
        increase.dataset.productId = item.id;
        increase.setAttribute('aria-label', `Increase ${item.name} quantity`);
        const remove = createElement('button', 'text-sm text-red-700 underline ml-2', 'Remove');
        remove.type = 'button';
        remove.dataset.cartAction = 'remove';
        remove.dataset.productId = item.id;
        controls.append(decrease, quantity, increase, remove);
        row.append(image, detail, controls);
        container.append(row);
      });
    }

    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const heading = document.querySelector('main h1');
    const headingCount = heading?.querySelector('span');
    if (headingCount) headingCount.textContent = `(${count} ${count === 1 ? 'item' : 'items'})`;
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const discount = getPromoDiscount(subtotal);
    const aside = container.closest('main')?.querySelector('aside');
    if (!aside) return;
    aside.querySelectorAll('.space-y-3 > div').forEach((row) => {
      const labelNode = row.querySelector('span');
      const label = labelNode?.textContent.toLowerCase() || '';
      const value = row.querySelector('span:last-child');
      if (label.startsWith('subtotal') && value) {
        labelNode.textContent = `Subtotal (${count} ${count === 1 ? 'item' : 'items'})`;
        value.textContent = currency.format(subtotal);
      }
      if (label === 'delivery' && value) value.textContent = currency.format(cart.length ? 25 : 0);
      if (label.startsWith('vat') || label.includes('tax')) row.remove();
      if (label.includes('promo discount') && value) value.textContent = `−${currency.format(discount)}`;
    });
    const total = aside.querySelector('.flex.justify-between.items-center span:last-child');
    if (total) total.textContent = currency.format(subtotal - discount + (cart.length ? 25 : 0));
    const checkout = aside.querySelector('a[href="checkout.html"]');
    if (checkout) {
      checkout.setAttribute('aria-disabled', String(cart.length === 0));
      checkout.classList.toggle('opacity-50', cart.length === 0);
      checkout.classList.toggle('pointer-events-none', cart.length === 0);
    }
  };

  const getDeliveryFee = () => {
    const selected = document.querySelector('input[name="delivery"]:checked');
    return selected ? Number(selected.dataset.fee || 0) : 25;
  };

  const getPromoDiscount = (subtotal) => readStored(PROMO_KEY, '') === 'SOSHA10'
    ? Math.round(subtotal * 0.1 * 100) / 100
    : 0;

  document.querySelector('#apply-promo')?.addEventListener('click', () => {
    const input = document.querySelector('#promo-code');
    const status = document.querySelector('#promo-status');
    const valid = input?.value.trim().toUpperCase() === 'SOSHA10';
    if (!writeStored(PROMO_KEY, valid ? 'SOSHA10' : '')) return;
    if (status) {
      status.textContent = valid ? 'Discount applied: 10% off your order subtotal.' : 'That code was not recognised.';
      status.className = `text-xs mt-2 ${valid ? 'text-green-700' : 'text-red-700'}`;
    }
    renderCart();
    renderCheckout();
  });

  const renderCheckout = () => {
    const summary = document.querySelector('#checkout-items');
    if (!summary) return;
    const cart = getCart();
    summary.replaceChildren();
    cart.forEach((item) => {
      const row = createElement('div', 'flex gap-3 items-center');
      const image = createElement('img', 'w-14 h-14 rounded-lg object-cover flex-shrink-0');
      image.src = item.image || fallbackImage;
      image.alt = item.alt || item.name;
      const text = createElement('div', 'flex-1 min-w-0');
      text.append(
        createElement('p', 'text-xs font-medium truncate', item.name),
        createElement('p', 'text-xs text-neutral-400', `Qty ${item.quantity}`),
      );
      row.append(image, text, createElement('span', 'text-xs font-semibold', currency.format(item.price * item.quantity)));
      summary.append(row);
    });
    if (!cart.length) {
      const empty = createElement('p', 'text-sm text-neutral-500', 'Your cart is empty.');
      summary.append(empty);
    }
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const aside = summary.closest('aside');
    if (!aside) return;
    aside.querySelectorAll('.space-y-3 > div').forEach((row) => {
      const label = row.querySelector('span')?.textContent.toLowerCase() || '';
      const value = row.querySelector('span:last-child');
      if (label.startsWith('subtotal') && value) value.textContent = currency.format(subtotal);
      if (label === 'delivery' && value) value.textContent = currency.format(cart.length ? getDeliveryFee() : 0);
      if (label.startsWith('vat') || label.includes('tax')) row.remove();
    });
    const breakdown = aside.querySelector('.space-y-3');
    let discountRow = breakdown?.querySelector('[data-promo-discount]');
    const discount = getPromoDiscount(subtotal);
    if (discount && breakdown) {
      if (!discountRow) {
        discountRow = createElement('div', 'flex justify-between text-neutral-600');
        discountRow.dataset.promoDiscount = '';
        discountRow.append(createElement('span', '', 'Discount'), createElement('span', 'text-brand-dark font-medium'));
        breakdown.append(discountRow);
      }
      discountRow.querySelector('span:last-child').textContent = `−${currency.format(discount)}`;
    } else {
      discountRow?.remove();
    }
    const total = aside.querySelector('.flex.justify-between.items-center span:last-child');
    if (total) total.textContent = currency.format(subtotal - discount + (cart.length ? getDeliveryFee() : 0));
    const orderButton = aside.querySelector('[data-place-order]');
    if (orderButton) orderButton.disabled = cart.length === 0;
  };

  const cardProducts = [...document.querySelectorAll('main article')]
    .map((card) => [card, getProduct(card)])
    .filter((entry) => entry[1]);

  cardProducts.forEach(([card, product]) => {
    card.dataset.productId = product.id;
    const productLinks = card.querySelectorAll('a[href*="product-details.html"]');
    productLinks.forEach((link) => {
      const url = new URL(link.href, window.location.href);
      url.searchParams.set('product', product.id);
      link.href = url.href;
      link.addEventListener('click', () => {
        catalog.set(product.id, product);
        writeStored(CATALOG_KEY, [...catalog.values()]);
      });
    });
    card.querySelectorAll('button').forEach((button) => {
      const icon = button.querySelector('svg');
      const iconName = `${icon?.className?.baseVal || ''} ${icon?.getAttribute('data-icon') || ''}`;
      if (/fa-plus|\bplus\b/i.test(iconName)) {
        button.type = 'button';
        button.setAttribute('aria-label', `Add ${product.name} to cart`);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          addToCart(product);
        });
      } else if (/fa-heart|\bheart\b/i.test(iconName)) {
        const favorites = readStored(FAVORITES_KEY, []);
        const saved = Array.isArray(favorites) && favorites.includes(product.id);
        button.setAttribute('aria-pressed', String(saved));
        button.setAttribute('aria-label', `${saved ? 'Remove' : 'Add'} ${product.name} ${saved ? 'from' : 'to'} favourites`);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const current = readStored(FAVORITES_KEY, []);
          const updated = Array.isArray(current) && current.includes(product.id)
            ? current.filter((id) => id !== product.id)
            : [...(Array.isArray(current) ? current : []), product.id];
          if (writeStored(FAVORITES_KEY, updated)) {
            button.setAttribute('aria-pressed', String(updated.includes(product.id)));
            announce(updated.includes(product.id) ? 'Saved to your favourites.' : 'Removed from your favourites.', 'success');
          }
        });
      }
    });
  });

  document.querySelectorAll('button[data-product-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = catalog.get(button.dataset.productAdd);
      if (product) addToCart(product);
    });
  });

  catalog = getCatalog();

  const detailId = new URLSearchParams(window.location.search).get('product');
  const detailProduct = detailId ? catalog.get(detailId) : null;
  if (detailProduct && document.querySelector('#product-info')) {
    const detail = document.querySelector('#product-info');
    const title = detail.querySelector('h1');
    const price = detail.querySelector('.text-3xl');
    const seller = detail.querySelector(':scope > a');
    const image = document.querySelector('#product-gallery > div img');
    if (title) title.textContent = detailProduct.name;
    if (price) price.textContent = currency.format(detailProduct.price);
    if (seller) {
      const sellerLabel = seller.querySelector('span')
        || [...seller.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (sellerLabel) sellerLabel.textContent = detailProduct.seller;
      else seller.textContent = detailProduct.seller;
      seller.querySelector('svg[data-icon="circle-check"]')?.remove();
    }
    if (image) {
      image.src = detailProduct.image;
      image.alt = detailProduct.alt;
    }
    const categoryLink = [...document.querySelectorAll('main a[href="products.html"]')]
      .find((link) => link.textContent.trim() !== 'Shop');
    if (categoryLink && detailProduct.category) {
      categoryLink.textContent = detailProduct.category.replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
    const description = detail.querySelector('.leading-relaxed');
    if (description) description.textContent = `Available from ${detailProduct.seller}, a local Soshanguve seller. Contact the business to confirm current stock, collection, and delivery details.`;
    document.querySelector('#product-gallery')?.querySelectorAll('button').forEach((button) => button.remove());
  }

  const productDetail = document.querySelector('#product-info');
  if (productDetail) {
    if (!detailProduct) {
      const seller = productDetail.querySelector(':scope > a');
      if (seller) seller.textContent = 'Soshanguve local seller';
    }
    productDetail.querySelector(':scope > a svg[data-icon="circle-check"]')?.remove();
    const productMeta = productDetail.querySelector('.flex.items-center.gap-3.mb-5');
    if (productMeta) {
      productMeta.replaceChildren(createElement('span', 'text-sm text-neutral-500', 'Ratings and sales history unavailable'));
    }
    const priceNote = productDetail.querySelector('.text-sm.text-neutral-400.mb-1');
    if (priceNote) priceNote.textContent = '';
    productDetail.querySelector('.grid.grid-cols-2.gap-4.mb-6.text-sm')?.remove();
    [...productDetail.querySelectorAll('p')]
      .find((paragraph) => paragraph.textContent.includes('Buyer protection'))?.parentElement?.remove();
    [...productDetail.querySelectorAll('a')]
      .find((link) => link.textContent.trim() === 'Message seller')?.replaceChildren('Contact seller');
    [...productDetail.querySelectorAll('a')]
      .find((link) => link.textContent.trim() === 'Share')?.remove();
  }
  document.querySelector('#product-tabs')?.remove();

  if (document.querySelector('#product-gallery')) {
    const gallery = document.querySelector('#product-gallery');
    const heroImage = gallery.querySelector(':scope > div img');
    gallery.querySelectorAll('button img').forEach((thumbnail) => {
      const button = thumbnail.closest('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View ${thumbnail.alt || 'product image'}`);
      button.addEventListener('click', () => {
        if (heroImage) {
          heroImage.src = thumbnail.src;
          heroImage.alt = thumbnail.alt;
        }
      });
    });
  }

  const quantityInput = document.querySelector('#product-info input[type="number"], #product-info input[type="text"]');
  if (quantityInput) {
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.step = '1';
    quantityInput.inputMode = 'numeric';
    const quantityControls = quantityInput.parentElement;
    quantityControls?.querySelectorAll('button').forEach((button) => {
      const icon = `${button.querySelector('svg')?.className?.baseVal || ''} ${button.querySelector('svg')?.getAttribute('data-icon') || ''}`;
      if (/fa-minus|\bminus\b/i.test(icon)) {
        button.type = 'button';
        button.setAttribute('aria-label', 'Decrease quantity');
        button.addEventListener('click', () => {
          quantityInput.value = String(Math.max(1, (Number(quantityInput.value) || 1) - 1));
        });
      } else if (/fa-plus|\bplus\b/i.test(icon)) {
        button.type = 'button';
        button.setAttribute('aria-label', 'Increase quantity');
        button.addEventListener('click', () => {
          quantityInput.value = String(Math.max(1, Number(quantityInput.value) || 1) + 1);
        });
      }
    });
    quantityInput.addEventListener('change', () => {
      quantityInput.value = String(Math.max(1, Math.floor(Number(quantityInput.value) || 1)));
    });
  }

  document.querySelectorAll('#product-info a').forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    if (label.includes('add to cart') || label === 'buy now') {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const product = detailProduct || {
          id: 'premium-rooibos-tea-blend-250g',
          name: document.querySelector('#product-info h1')?.textContent.trim() || 'Local product',
          seller: document.querySelector('#product-info > a')?.textContent.trim() || 'Soshanguve local seller',
          price: readPrice(document.querySelector('#product-info .text-3xl')?.textContent || ''),
          image: document.querySelector('#product-gallery > div img')?.src || fallbackImage,
          alt: document.querySelector('#product-gallery > div img')?.alt || 'Local product',
          location: 'Soshanguve, Tshwane'
        };
        const quantityInput = document.querySelector('#product-info input[type="number"]');
        const quantity = Math.max(1, Math.floor(Number(quantityInput?.value) || 1));
        if (!addToCart(product, quantity)) return;
        window.location.href = label === 'buy now' ? 'checkout.html' : 'cart.html';
      });
    }
  });

  const cartContainer = document.querySelector('#cart-items');
  cartContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const cart = getCart();
    const item = cart.find((entry) => entry.id === button.dataset.productId);
    if (!item) return;
    if (button.dataset.cartAction === 'remove') {
      setCart(cart.filter((entry) => entry.id !== item.id));
    } else if (button.dataset.cartAction === 'increase') {
      item.quantity += 1;
      setCart(cart);
    } else if (button.dataset.cartAction === 'decrease') {
      if (item.quantity === 1) setCart(cart.filter((entry) => entry.id !== item.id));
      else {
        item.quantity -= 1;
        setCart(cart);
      }
    }
  });

  document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener('change', () => {
      const collectionPayment = document.querySelector('input[name="payment"][value="cash_on_collection"]');
      const deliveryPayment = document.querySelector('input[name="payment"][value="cash_on_delivery"]');
      if (input.checked && input.value === 'collection' && collectionPayment) collectionPayment.checked = true;
      if (input.checked && input.value !== 'collection' && deliveryPayment) deliveryPayment.checked = true;
      renderCheckout();
    });
  });

  document.querySelector('[data-place-order]')?.addEventListener('click', () => {
    const cart = getCart();
    if (!cart.length) {
      announce('Add a product to your cart before placing your order.');
      return;
    }
    const name = document.querySelector('#delivery-name')?.value.trim();
    const phone = document.querySelector('#delivery-phone')?.value.trim();
    const delivery = document.querySelector('input[name="delivery"]:checked')?.value || 'standard';
    const neighborhood = document.querySelector('#delivery-neighborhood')?.value;
    const street = document.querySelector('#delivery-street')?.value.trim();
    if (!name || !phone || !neighborhood || (delivery !== 'collection' && !street)) {
      announce(delivery === 'collection'
        ? 'Enter your name, phone number, and Soshanguve area to reserve collection.'
        : 'Enter your name, phone number, Soshanguve area, and delivery address to continue.');
      return;
    }
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const discount = getPromoDiscount(subtotal);
    const order = {
      id: `BC-${Date.now().toString(36).toUpperCase()}`,
      status: 'demo-only',
      buyer: { name, phone },
      location: `${neighborhood}, Soshanguve, Tshwane`,
      streetAddress: delivery === 'collection' ? '' : street,
      delivery,
      items: cart,
      subtotal,
      discount,
      deliveryFee: delivery === 'collection' ? 0 : getDeliveryFee(),
      total: subtotal - discount + (delivery === 'collection' ? 0 : getDeliveryFee()),
      payment: document.querySelector('input[name="payment"]:checked')?.value || 'cash_on_delivery',
      createdAt: new Date().toISOString()
    };
    const orders = readStored(ORDERS_KEY, []);
    const nextOrders = Array.isArray(orders) ? [...orders, order] : [order];
    if (!writeStored(ORDERS_KEY, nextOrders)) return;
    if (!setCart([])) return;
    const status = document.querySelector('[data-checkout-status]');
    if (status) {
      status.textContent = `Order ${order.id} saved on this device. No payment was taken, and the seller has not received this order.`;
      status.className = 'notice success show';
    }
    document.querySelector('[data-place-order]').disabled = true;
  });

  const searchQuery = new URLSearchParams(window.location.search).get('search') || '';
  const allSearchInputs = [...document.querySelectorAll(
    'input[type="search"], input[placeholder*="Search products"], input[placeholder*="What are you looking for"]'
  )];
  const isHomePage = window.location.pathname.endsWith('/home.html');
  allSearchInputs.forEach((input) => {
    input.value = searchQuery;
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const resultsUrl = new URL('../shop/products.html', window.location.href);
      resultsUrl.searchParams.set('search', input.value.trim());
      window.location.href = resultsUrl.href;
    });
  });
  const homeSearchInputs = isHomePage ? allSearchInputs : [];
  const homeProductCards = isHomePage
    ? [...document.querySelectorAll('main article.group')].filter((card) => getProduct(card))
    : [];
  const homeBusinessCards = isHomePage
    ? [...document.querySelectorAll('main a.group')].filter((card) => card.querySelector('h3'))
    : [];
  const homeCategoryButtons = (isHomePage ? [...document.querySelectorAll('main button')] : []).filter((button) => (
    ['all', 'food', 'fashion', 'crafts', 'beauty'].includes(button.textContent.trim().toLowerCase())
  ));
  let homeCategory = 'all';
  const filterHome = () => {
    const query = homeSearchInputs.map((input) => input.value.trim().toLowerCase()).find(Boolean) || '';
    [...homeProductCards, ...homeBusinessCards].forEach((card) => {
      const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
      const matchesCategory = homeCategory === 'all'
        || (homeCategory === 'food' && /food|bakery|bread|biltong|tea|produce|kitchen/.test(card.textContent.toLowerCase()))
        || (homeCategory === 'fashion' && /fashion|textile|bead|clothing|threads/.test(card.textContent.toLowerCase()))
        || (homeCategory === 'crafts' && /craft|ceramic|basket|home|weave/.test(card.textContent.toLowerCase()))
        || (homeCategory === 'beauty' && /beauty|wellness|marula|skin|soap/.test(card.textContent.toLowerCase()));
      card.hidden = !matchesSearch || !matchesCategory;
    });
  };
  homeSearchInputs.forEach((input) => input.addEventListener('input', filterHome));
  homeCategoryButtons.forEach((button) => {
    button.type = 'button';
    button.addEventListener('click', () => {
      homeCategory = button.textContent.trim().toLowerCase();
      homeSearchInputs.forEach((input) => { input.value = ''; });
      filterHome();
    });
  });
  filterHome();
  const productGrid = window.location.pathname.endsWith('/products.html')
    ? [...document.querySelectorAll('main .grid')].find((grid) => grid.querySelector('article.group'))
    : null;
  const productCards = productGrid ? [...productGrid.querySelectorAll('article.group')] : [];
  if (productGrid && productCards.length) {
    const searchInputs = [...document.querySelectorAll('input[placeholder*="Search products"], input[placeholder*="Search within results"]')];
    searchInputs.forEach((input) => { input.value = searchQuery; });
    const categoryInputs = [...document.querySelectorAll('#filters-sidebar input[type="checkbox"]')];
    const unsupportedFilters = [
      ...document.querySelectorAll('#filters-sidebar input[type="checkbox"]')
    ].filter((input) => /verified|soshanguve local listings/i.test(input.closest('label')?.textContent || ''));
    unsupportedFilters.forEach((input) => input.closest('div.border-t')?.remove());
    const ratingHeading = [...document.querySelectorAll('#filters-sidebar h3')]
      .find((heading) => heading.textContent.trim() === 'Rating');
    ratingHeading?.closest('div.border-t')?.remove();
    const areaHeading = [...document.querySelectorAll('#filters-sidebar h3')]
      .find((heading) => heading.textContent.trim() === 'Province');
    if (areaHeading) {
      const areaSection = areaHeading.closest('div.border-t');
      areaHeading.textContent = 'Marketplace area';
      areaSection?.querySelector('.relative')?.replaceChildren(createElement('p', 'text-sm text-neutral-600', 'Soshanguve, Tshwane'));
    }
    const sort = document.querySelector('#sort');
    sort?.querySelectorAll('option').forEach((option) => {
      if (/newest|top rated/i.test(option.textContent)) option.remove();
    });
    const applyButton = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Apply');
    const priceInputs = [...document.querySelectorAll('#filters-sidebar input[type="number"]')];
    const minPriceInput = priceInputs[0];
    const maxPriceInput = priceInputs[1];
    const priceSlider = document.querySelector('#filters-sidebar input[type="range"]');
    const highestPrice = Math.max(0, ...productCards.map((card) => getProduct(card)?.price || 0));
    if (minPriceInput) minPriceInput.min = '0';
    if (maxPriceInput) {
      maxPriceInput.max = String(highestPrice);
      if (Number(maxPriceInput.value) < highestPrice) maxPriceInput.value = String(highestPrice);
    }
    if (priceSlider) {
      priceSlider.min = '0';
      priceSlider.max = String(highestPrice);
      priceSlider.value = String(highestPrice);
    }
    const categoryCounts = new Map();
    productCards.forEach((card) => {
      const category = getProduct(card)?.category || 'other';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });
    categoryInputs.forEach((input) => {
      const label = input.closest('label')?.textContent.toLowerCase().trim();
      const count = categoryCounts.get(label) || 0;
      const countLabel = input.closest('li')?.querySelector(':scope > span');
      if (countLabel) countLabel.textContent = `(${count})`;
    });
    document.querySelectorAll('main .text-yellow-500').forEach((rating) => rating.remove());
    const resultSummary = document.querySelector('main h1')?.parentElement?.querySelector('p');
    if (resultSummary) resultSummary.textContent = 'Local listings in Soshanguve';
    const initialOrder = new Map(productCards.map((card, index) => [card, index]));
    let empty = document.querySelector('[data-product-empty]');
    if (!empty) {
      empty = createElement('p', 'col-span-full py-12 text-center text-neutral-500', 'No local products match those filters. Try changing your search or filters.');
      empty.dataset.productEmpty = '';
      empty.hidden = true;
      productGrid.after(empty);
    }
    const filterProducts = () => {
      const query = searchInputs.map((input) => input.value.trim().toLowerCase()).find(Boolean) || '';
      const selectedCategories = categoryInputs.filter((input) => input.checked)
        .map((input) => input.closest('label')?.textContent.toLowerCase().trim() || '');
      const minPrice = Number(minPriceInput?.value || 0);
      const maxPrice = Number(maxPriceInput?.value || Infinity);
      const visibleCards = productCards.filter((card) => {
        const text = card.textContent.toLowerCase();
        const price = readPrice(text);
        const category = getProduct(card)?.category.toLowerCase() || '';
        const matchesCategory = !selectedCategories.length || selectedCategories.some((value) => category === value);
        return (!query || text.includes(query))
          && matchesCategory
          && price >= minPrice
          && price <= maxPrice;
      });
      const order = sort?.value.toLowerCase() || '';
      if (order.includes('price') && order.includes('low')) {
        visibleCards.sort((a, b) => readPrice(a.textContent) - readPrice(b.textContent));
      } else if (order.includes('price') && order.includes('high')) {
        visibleCards.sort((a, b) => readPrice(b.textContent) - readPrice(a.textContent));
      } else if (order.includes('name') || order.includes('alphabet')) {
        visibleCards.sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
      } else {
        visibleCards.sort((a, b) => initialOrder.get(a) - initialOrder.get(b));
      }
      const visible = new Set(visibleCards);
      productCards.forEach((card) => { card.hidden = !visible.has(card); });
      visibleCards.forEach((card) => productGrid.append(card));
      const resultCount = document.querySelector('[data-product-count]');
      if (resultCount) resultCount.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? 'product' : 'products'}`;
      if (resultSummary) resultSummary.textContent = `${visibleCards.length} local ${visibleCards.length === 1 ? 'product' : 'products'} in Soshanguve`;
      empty.hidden = visibleCards.length > 0;
      if (priceSlider && maxPriceInput && document.activeElement !== priceSlider) {
        priceSlider.value = String(Math.min(Number(priceSlider.max), Math.max(Number(priceSlider.min), Number(maxPriceInput.value) || Number(priceSlider.max))));
      }
    };
    searchInputs.forEach((input) => input.addEventListener('input', filterProducts));
    categoryInputs.forEach((input) => input.addEventListener('change', filterProducts));
    priceInputs.forEach((input) => input.addEventListener('input', filterProducts));
    priceSlider?.addEventListener('input', () => {
      if (maxPriceInput) maxPriceInput.value = priceSlider.value;
      filterProducts();
    });
    sort?.addEventListener('change', filterProducts);
    applyButton?.addEventListener('click', filterProducts);
    filterProducts();
  }

  const header = document.querySelector('header');
  if (header) {
    const nav = header.querySelector('nav');
    const menu = [...header.querySelectorAll('button')].find((button) => /fa-bars|menu/i.test(button.innerHTML));
    menu?.addEventListener('click', () => {
      if (!nav) return;
      const open = !nav.classList.contains('storefront-nav-open');
      nav.classList.toggle('storefront-nav-open', open);
      if (open) {
        nav.classList.remove('hidden');
        if (window.getComputedStyle(header).position === 'static') header.style.position = 'relative';
      }
      else if (nav.dataset.wasHidden === 'true') nav.classList.add('hidden');
      menu.setAttribute('aria-expanded', String(open));
    });
    if (nav?.classList.contains('hidden')) nav.dataset.wasHidden = 'true';
    const sellButton = [...header.querySelectorAll('button')].find((button) => /sell on bizconnect/i.test(button.textContent));
    sellButton?.addEventListener('click', () => { window.location.href = '../business/onboarding.html'; });
    const accountButton = [...header.querySelectorAll('button')].find((button) => /fa-user|user/i.test(button.innerHTML));
    accountButton?.addEventListener('click', () => { window.location.href = '../account/login.html'; });
  }

  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    image.src = fallbackImage;
  }, true);

  updateCartBadges();
  renderCart();
  renderCheckout();
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) {
      updateCartBadges();
      renderCart();
      renderCheckout();
    }
  });
})();
