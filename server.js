const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabase-config');

const root = __dirname;
const port = process.env.PORT || 3000;
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function send(response, status, body, type = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  response.end(body);
}

async function supabaseRequest(table, options = {}) {
  const headers = {
    apikey: supabase.publishableKey,
    Authorization: `Bearer ${supabase.publishableKey}`,
    'Content-Type': 'application/json',
    Prefer: options.prefer || 'return=representation'
  };
  const result = await fetch(`${supabase.url}/rest/v1/${table}${options.query || ''}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const responseBody = await result.text();
  if (!result.ok) {
    throw new Error(`Supabase ${result.status}: ${responseBody}`);
  }
  return responseBody ? JSON.parse(responseBody) : [];
}

const server = http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/orders') {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', async () => {
      try {
        const order = JSON.parse(body);
        if (!order.customer?.name || !order.customer?.phone || !order.customer?.address || !order.items?.length) {
          send(response, 400, JSON.stringify({ error: 'Missing required order details' }));
          return;
        }
        const products = await supabaseRequest('products', {
          query: '?select=id,name,price&is_active=eq.true'
        });
        const productByName = new Map(products.map((product) => [product.name, product]));
        const quantities = new Map();
        for (const item of order.items) {
          quantities.set(item.name, (quantities.get(item.name) || 0) + (Number(item.quantity) || 1));
        }
        const orderItems = [...quantities.entries()].map(([name, quantity]) => {
          const product = productByName.get(name);
          if (!product) throw new Error(`Unknown product: ${name}`);
          return {
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity,
            line_total: product.price * quantity
          };
        });
        const subtotal = orderItems.reduce((sum, item) => sum + item.line_total, 0);
        const orderNumber = `RO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const orderData = {
          order_number: orderNumber,
          customer_name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email || null,
          address: order.customer.address,
          city: order.customer.city,
          pincode: order.customer.pincode,
          maps_link: order.customer.mapsLink || null,
          latitude: order.customer.latitude || null,
          longitude: order.customer.longitude || null,
          payment_method: 'cash_on_delivery',
          payment_status: 'pending',
          order_status: 'new',
          subtotal,
          delivery_fee: 0,
          total_amount: subtotal
        };
        const savedOrder = await supabaseRequest('rpc/create_order', {
          method: 'POST',
          body: { order_data: orderData, item_data: orderItems }
        });
        send(response, 201, JSON.stringify({ orderId: orderNumber }));
      } catch (error) {
        console.error('Order creation failed', error);
        send(response, 400, JSON.stringify({ error: 'The order could not be saved' }));
      }
    });
    return;
  }

  const requestPath = decodeURIComponent(request.url.split('?')[0]);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(response, 404, 'Not found', 'text/plain; charset=utf-8');
    return;
  }
  send(response, 200, fs.readFileSync(filePath), mimeTypes[path.extname(filePath)] || 'application/octet-stream');
});

server.listen(port, () => console.log(`Radhika Orchards running at http://localhost:${port}`));
