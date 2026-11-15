const SUPABASE_URL = 'https://hgistzlftkkhdhdwnssl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_X80y2fe5DFoZE2mGufRNHA_LhfvWHsF';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const dashboardError = document.querySelector('#dashboardError');
const ordersBody = document.querySelector('#ordersBody');
const emptyState = document.querySelector('#emptyState');
const statusFilter = document.querySelector('#statusFilter');
let orders = [];
let orderItems = [];

function formatCurrency(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function statusLabel(status) { return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
function renderOrders() {
  const visible = statusFilter.value === 'all' ? orders : orders.filter((order) => order.order_status === statusFilter.value);
  emptyState.hidden = visible.length > 0;
  ordersBody.innerHTML = visible.map((order) => `<tr><td><span class="order-id">${order.order_number}</span><br /><small>${new Date(order.created_at).toLocaleString('en-IN')}</small></td><td><div class="customer-name">${escapeHtml(order.customer_name)}</div><span>${escapeHtml(order.phone)}</span></td><td><div class="address">${escapeHtml(order.address)}, ${escapeHtml(order.city)} — ${escapeHtml(order.pincode)}</div></td><td><strong>${formatCurrency(order.total_amount)}</strong><br /><small>Free delivery</small></td><td><select class="status-select" data-status="${order.order_status}" data-order-id="${order.id}" aria-label="Status for ${order.order_number}">${['new','confirmed','packed','out_for_delivery','delivered','cancelled'].map((status) => `<option value="${status}" ${status === order.order_status ? 'selected' : ''}>${statusLabel(status)}</option>`).join('')}</select></td><td><button class="view-button" data-view-order="${order.id}">View →</button></td></tr>`).join('');
  document.querySelectorAll('.status-select').forEach((select) => select.addEventListener('change', updateStatus));
  document.querySelectorAll('[data-view-order]').forEach((button) => button.addEventListener('click', () => showDetails(Number(button.dataset.viewOrder))));
}
async function loadOrders() {
  dashboardError.textContent = '';
  const { data: fetchedOrders, error: ordersError } = await client.from('orders').select('*').order('created_at', { ascending: false });
  if (ordersError) throw ordersError;
  const { data: fetchedItems, error: itemsError } = await client.from('order_items').select('*');
  if (itemsError) throw itemsError;
  orders = fetchedOrders || [];
  orderItems = fetchedItems || [];
  document.querySelector('#newCount').textContent = orders.filter((order) => order.order_status === 'new').length;
  document.querySelector('#totalCount').textContent = orders.length;
  const today = new Date().toISOString().slice(0, 10);
  document.querySelector('#salesTotal').textContent = formatCurrency(orders.filter((order) => order.created_at.slice(0, 10) === today && order.order_status !== 'cancelled').reduce((sum, order) => sum + order.total_amount, 0));
  renderOrders();
}
async function updateStatus(event) {
  const orderId = event.target.dataset.orderId;
  const nextStatus = event.target.value;
  const { error } = await client.from('orders').update({ order_status: nextStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
  if (error) { dashboardError.textContent = 'Could not update the order status. Please try again.'; return; }
  const order = orders.find((item) => String(item.id) === orderId);
  if (order) order.order_status = nextStatus;
  renderOrders();
}
function showDetails(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;
  const items = orderItems.filter((item) => item.order_id === orderId);
  const mapUrl = order.latitude && order.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}` : order.maps_link;
  document.querySelector('#detailOrderNumber').textContent = order.order_number;
  document.querySelector('#detailContent').innerHTML = `<div class="detail-block"><h3>Customer</h3><p><strong>${escapeHtml(order.customer_name)}</strong></p><p>${escapeHtml(order.phone)}</p><p>${escapeHtml(order.email || 'No email provided')}</p></div><div class="detail-block"><h3>Delivery location</h3><p>${escapeHtml(order.address)}</p><p>${escapeHtml(order.city)} — ${escapeHtml(order.pincode)}</p>${mapUrl ? `<a class="map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">Open directions in Google Maps ↗</a>` : '<p class="muted">No map location provided.</p>'}</div><div class="detail-block"><h3>Items</h3>${items.map((item) => `<div class="item-row"><span>${escapeHtml(item.product_name)} × ${item.quantity}</span><strong>${formatCurrency(item.line_total)}</strong></div>`).join('')}</div><div class="detail-total"><span>Total</span><strong>${formatCurrency(order.total_amount)}</strong></div>`;
  document.querySelector('#detailOverlay').hidden = false;
  document.querySelector('#orderDetail').hidden = false;
}
function closeDetails() { document.querySelector('#detailOverlay').hidden = true; document.querySelector('#orderDetail').hidden = true; }
async function init() {
  const { data } = await client.auth.getSession();
  if (!data.session) { window.location.href = 'admin.html'; return; }
  document.querySelector('#adminEmail').textContent = data.session.user.email || '';
  loadOrders().catch((error) => { dashboardError.textContent = 'Orders could not be loaded. Check the Supabase policies.'; console.error(error); });
}
document.querySelector('#signOut').addEventListener('click', async () => { await client.auth.signOut(); window.location.href = 'admin.html'; });
document.querySelector('#refreshOrders').addEventListener('click', () => loadOrders().catch(() => { dashboardError.textContent = 'Orders could not be loaded.'; }));
statusFilter.addEventListener('change', renderOrders);
document.querySelector('#closeDetail').addEventListener('click', closeDetails);
document.querySelector('#detailOverlay').addEventListener('click', closeDetails);
init();
