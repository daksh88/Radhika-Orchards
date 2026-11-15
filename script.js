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

document.querySelectorAll('.add-button').forEach((button) => {
  button.addEventListener('click', () => {
    const existing = cart.find((item) => item.name === button.dataset.product);
    if (existing) existing.quantity += 1;
    else cart.push({ name: button.dataset.product, price: Number(button.dataset.price), quantity: 1 });
    renderCart();
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

cartButton.addEventListener('click', openCart);
closeCart.addEventListener('click', hideCart);
cartOverlay.addEventListener('click', hideCart);
toastBagButton.addEventListener('click', openCart);
document.querySelector('.checkout-button').addEventListener('click', () => {
  if (!cart.length) return;
  localStorage.setItem('radhikaCart', JSON.stringify(cart));
  window.location.href = 'checkout.html';
});
