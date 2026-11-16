const cart = [];
const cartButton = document.querySelector('#cartButton');
const cartDrawer = document.querySelector('#cartDrawer');
const cartOverlay = document.querySelector('#cartOverlay');
const closeCart = document.querySelector('#closeCart');
const cartItems = document.querySelector('#cartItems');
const cartCount = document.querySelector('#cartCount');
const drawerCount = document.querySelector('#drawerCount');
const cartTotal = document.querySelector('#cartTotal');
const bagToast = document.querySelector('#bagToast');
const toastCount = document.querySelector('#toastCount');
const toastBagButton = document.querySelector('#toastBagButton');
const productModal = document.querySelector('#productModal');
const modalProductImage = document.querySelector('#modalProductImage');
const modalProductName = document.querySelector('#modalProductName');
const modalProductPrice = document.querySelector('#modalProductPrice');
const modalProductDescription = document.querySelector('#modalProductDescription');
const modalAddButton = document.querySelector('#modalAddButton');
const modalQuantity = document.querySelector('#modalQuantity');
const modalQuantityValue = document.querySelector('#modalQuantityValue');
let activeProduct = null;
const productDetails = {
  'The Orchard Box': {
    image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?auto=format&fit=crop&w=900&q=85',
    description: 'Our generous family box, filled with naturally sweet kiwis selected at peak freshness. Ideal for sharing, gifting, or keeping the fruit bowl full all week.',
    weight: '2 kg total'
  },
  'The Mountain Pack': {
    image: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=900&q=85',
    description: 'A balanced weekly pack of crisp, vitamin-rich kiwis from our mountain orchard. Fresh, bright, and naturally delicious.',
    weight: '1 kg total'
  },
  'The Taster Pack': {
    image: 'https://images.unsplash.com/photo-1519096845289-95806ee03a1a?auto=format&fit=crop&w=900&q=85',
    description: 'A smaller box for your first taste of Radhika Orchards. Perfect for breakfast bowls, smoothies, and a fresh daily ritual.',
    weight: '500 g total'
  }
};

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function hideCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;
  drawerCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  cartTotal.textContent = `₹${cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}`;
  toastCount.textContent = count;
  bagToast.classList.toggle('visible', count > 0);
  document.querySelectorAll('.add-button, .quantity-control').forEach((button) => updateProductButton(button));

  if (!count) {
    cartItems.innerHTML = '<div class="empty-cart"><span>🥝</span><p>Your bag is waiting<br />for something fresh.</p></div>';
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="drawer-item">
      <div><h4>${item.name}</h4><p>${item.quantity} box${item.quantity === 1 ? '' : 'es'} · Naturally grown</p></div>
      <div class="drawer-quantity"><button class="drawer-minus" data-index="${index}">−</button><strong>${item.quantity}</strong><button class="drawer-plus" data-index="${index}">+</button></div>
      <strong>₹${item.price * item.quantity}</strong>
    </div>
  `).join('');

  document.querySelectorAll('.drawer-minus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.index), -1)));
  document.querySelectorAll('.drawer-plus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.index), 1)));
}

function changeQuantity(index, amount) {
  cart[index].quantity += amount;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  renderCart();
}

function addProduct(product, quantity = 1) {
  const existing = cart.find((item) => item.name === product.name);
  if (existing) existing.quantity += quantity;
  else cart.push({ ...product, quantity });
  renderCart();
}

function openProductModal(product) {
  activeProduct = product;
  const details = productDetails[product.name];
  modalProductImage.src = details.image;
  modalProductImage.alt = product.name;
  modalProductName.textContent = product.name;
  modalProductPrice.textContent = `₹${product.price} · ${details.weight}`;
  modalProductDescription.textContent = details.description;
  const item = cart.find((entry) => entry.name === product.name);
  modalAddButton.hidden = Boolean(item);
  modalQuantity.hidden = !item;
  modalQuantityValue.textContent = item ? item.quantity : 1;
  productModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  productModal.hidden = true;
  document.body.style.overflow = '';
  activeProduct = null;
}

document.querySelectorAll('.add-button').forEach((button) => {
  button.addEventListener('click', () => {
    addProduct({ name: button.dataset.product, price: Number(button.dataset.price) });
    updateProductButton(button);
  });
});

function updateProductButton(button) {
  const item = cart.find((entry) => entry.name === button.dataset.product);
  if (!item) {
    button.className = 'add-button';
    button.innerHTML = 'Add to bag <span>+</span>';
    return;
  }
  button.className = 'quantity-control';
  button.innerHTML = `<span class="quantity-minus">−</span><strong>${item.quantity}</strong><span class="quantity-plus">+</span>`;
  button.querySelector('.quantity-minus').addEventListener('click', (event) => {
    event.stopPropagation();
    changeProductQuantity(button, -1);
  });
  button.querySelector('.quantity-plus').addEventListener('click', (event) => {
    event.stopPropagation();
    changeProductQuantity(button, 1);
  });
}

function changeProductQuantity(button, amount) {
  const item = cart.find((entry) => entry.name === button.dataset.product);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
  updateProductButton(button);
}

document.querySelectorAll('.product-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    const button = card.querySelector('[data-product]');
    openProductModal({ name: button.dataset.product, price: Number(button.dataset.price) });
  });
});

modalAddButton.addEventListener('click', () => {
  if (!activeProduct) return;
  addProduct(activeProduct);
  modalAddButton.hidden = true;
  modalQuantity.hidden = false;
  modalQuantityValue.textContent = cart.find((item) => item.name === activeProduct.name).quantity;
});

document.querySelector('#modalMinus').addEventListener('click', () => {
  if (!activeProduct) return;
  const item = cart.find((entry) => entry.name === activeProduct.name);
  if (item) item.quantity -= 1;
  if (item && item.quantity <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
  const next = cart.find((entry) => entry.name === activeProduct.name);
  if (!next) {
    modalAddButton.hidden = false;
    modalQuantity.hidden = true;
    return;
  }
  modalQuantityValue.textContent = next.quantity;
});

document.querySelector('#modalPlus').addEventListener('click', () => {
  if (!activeProduct) return;
  addProduct(activeProduct);
  modalQuantity.hidden = false;
  modalAddButton.hidden = true;
  modalQuantityValue.textContent = cart.find((item) => item.name === activeProduct.name).quantity;
});

document.querySelector('#closeProductModal').addEventListener('click', closeProductModal);
productModal.addEventListener('click', (event) => {
  if (event.target === productModal) closeProductModal();
});

cartButton.addEventListener('click', openCart);
closeCart.addEventListener('click', hideCart);
cartOverlay.addEventListener('click', hideCart);
toastBagButton.addEventListener('click', openCart);
document.querySelector('.checkout-button').addEventListener('click', () => {
  if (!cart.length) return;
  localStorage.setItem('radhikaCart', JSON.stringify(cart));
  window.location.href = 'checkout.html';
});
