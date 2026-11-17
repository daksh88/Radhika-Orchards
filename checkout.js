const storedCart = JSON.parse(localStorage.getItem('radhikaCart') || '[]');
const orderApiUrl = window.location.protocol === 'file:'
  ? 'http://localhost:3000/api/orders'
  : '/api/orders';
const summaryItems = document.querySelector('#summaryItems');
const subtotal = storedCart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
const summaryMarkup = storedCart.length
  ? storedCart.map((item) => `<div class="summary-product"><div><h3>${item.name}</h3><p>${item.quantity || 1} box${(item.quantity || 1) === 1 ? '' : 'es'} · Naturally grown</p></div><strong>₹${item.price * (item.quantity || 1)}</strong></div>`).join('')
  : '<p class="field-help">Your bag is empty. Please go back and choose a pack.</p>';
summaryItems.innerHTML = summaryMarkup;
document.querySelector('#summarySubtotal').textContent = `₹${subtotal}`;
document.querySelector('#summaryTotal').textContent = `₹${subtotal}`;
if (!storedCart.length) {
  document.querySelector('#checkoutForm').hidden = true;
  document.querySelector('.checkout-intro').insertAdjacentHTML('afterend', '<div class="confirmation empty-checkout"><h2>Your bag is empty</h2><p>Choose a fresh kiwi pack before checking out.</p><a class="primary-button" href="index.html#shop">Shop the harvest <span>↗</span></a></div>');
}

document.querySelector('#locationButton').addEventListener('click', () => {
  const button = document.querySelector('#locationButton');
  if (!navigator.geolocation) {
    button.textContent = 'Location is not supported';
    return;
  }
  button.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      document.querySelector('#mapsLink').value = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
      button.textContent = '✓ Location added';
    },
    () => { button.textContent = 'Location permission denied'; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

document.querySelector('#checkoutForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!storedCart.length) return;
  const form = event.currentTarget;
  const formData = new FormData(form);
  const order = {
    customer: Object.fromEntries(formData.entries()),
    items: storedCart,
    subtotal,
    deliveryFee: 0,
    total: subtotal,
    createdAt: new Date().toISOString()
  };
  const button = form.querySelector('.place-order');
  button.disabled = true;
  button.textContent = 'Placing order…';
  try {
    const response = await fetch(orderApiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
    if (!response.ok) throw new Error('Order could not be saved');
    const savedOrder = await response.json();
    const trackedOrders = JSON.parse(localStorage.getItem('radhikaTrackedOrders') || '[]');
    trackedOrders.unshift({ orderId: savedOrder.orderId, status: 'new', createdAt: new Date().toISOString() });
    localStorage.setItem('radhikaTrackedOrders', JSON.stringify(trackedOrders.slice(0, 20)));
    localStorage.removeItem('radhikaCart');
    form.hidden = true;
    document.querySelector('#confirmation').hidden = false;
    document.querySelector('#orderNumber').textContent = `Order ID: ${savedOrder.orderId}`;
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Order submission failed', error);
    button.disabled = false;
    button.textContent = 'Place order ↗';
    alert('We could not save your order. Please make sure the website server is running, then try again.');
  }
});

document.querySelector('#closeConfirmation').addEventListener('click', () => {
  document.querySelector('#confirmation').hidden = true;
  document.body.style.overflow = '';
});
