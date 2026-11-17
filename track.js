const target = document.querySelector('#trackedOrders');
const statusLabel = (status) => String(status || 'new').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

async function renderTrackedOrders() {
  const trackedOrders = JSON.parse(localStorage.getItem('radhikaTrackedOrders') || '[]');
  if (!trackedOrders.length) {
    target.innerHTML = '<p class="muted tracking-empty">No orders found on this device yet.</p>';
    return;
  }
  const ids = trackedOrders.map((order) => String(order.orderId).trim().toUpperCase()).join(',');
  try {
    const response = await fetch(`/api/order-status?ids=${encodeURIComponent(ids)}`);
    if (!response.ok) throw new Error('Status lookup failed');
    const latestOrders = await response.json();
    const latestById = new Map(latestOrders.map((order) => [order.order_number, order]));
    trackedOrders.forEach((order) => {
      const latest = latestById.get(order.orderId);
      if (latest) order.status = latest.order_status;
    });
    localStorage.setItem('radhikaTrackedOrders', JSON.stringify(trackedOrders));
  } catch (error) {
    console.error('Could not refresh order statuses', error);
  }
  target.innerHTML = trackedOrders.map((order) => `<article class="tracked-order"><div><strong>${escapeHtml(order.orderId)}</strong><small>${new Date(order.createdAt).toLocaleString('en-IN')}</small></div><span>${escapeHtml(statusLabel(order.status))}</span></article>`).join('');
}

document.querySelector('#refreshTracking').addEventListener('click', renderTrackedOrders);
renderTrackedOrders();
setInterval(renderTrackedOrders, 15000);
