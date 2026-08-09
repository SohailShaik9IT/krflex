const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function localYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function localYm(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function buildBuckets(period, now) {
  const labels = [];
  const keys = [];

  if (period === 'daily') {
    // Today by hour (local)
    for (let h = 0; h < 24; h++) {
      const key = `${localYmd(now)} ${pad2(h)}`;
      keys.push(key);
      labels.push(`${pad2(h)}:00`);
    }
  } else if (period === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      keys.push(localYmd(d));
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }));
    }
  } else if (period === 'monthly') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      keys.push(localYmd(d));
      labels.push(`${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`);
    }
  } else {
    // yearly — last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(localYm(d));
      labels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }));
    }
  }

  return { labels, keys };
}

function orderBucketKey(orderDateEpoch, period) {
  const d = new Date(Number(orderDateEpoch) * 1000);
  if (period === 'daily') {
    return `${localYmd(d)} ${pad2(d.getHours())}`;
  }
  if (period === 'yearly') {
    return localYm(d);
  }
  return localYmd(d);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const period = ((event.queryStringParameters && event.queryStringParameters.period) || 'daily').toLowerCase();
    const now = new Date();
    let start;
    switch (period) {
      case 'weekly':
        start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); break;
      case 'monthly':
        start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0); break;
      case 'yearly':
        start = new Date(now.getFullYear(), now.getMonth() - 11, 1); break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of today
    }
    const startEpoch = Math.floor(start.getTime() / 1000);
    const nowEpoch = Math.floor(now.getTime() / 1000);

    const [{ count: totalCustomers }] = await sql`SELECT COUNT(*)::int AS count FROM customers`;

    const orderRows = await sql`
      SELECT order_date, sqft::float AS sqft
      FROM orders
      WHERE order_date >= ${startEpoch} AND order_date <= ${nowEpoch}
    `;

    const totalOrders = orderRows.length;
    const totalSqftSold = orderRows.reduce((sum, r) => sum + Number(r.sqft || 0), 0);

    const { labels, keys } = buildBuckets(period, now);
    const ordersByKey = Object.fromEntries(keys.map((k) => [k, 0]));
    const sqftByKey = Object.fromEntries(keys.map((k) => [k, 0]));

    for (const row of orderRows) {
      const key = orderBucketKey(row.order_date, period);
      if (key in ordersByKey) {
        ordersByKey[key] += 1;
        sqftByKey[key] += Number(row.sqft || 0);
      }
    }

    return json(200, {
      totalCustomers,
      totalSqftSold,
      totalOrders,
      period,
      chart: {
        labels,
        orders: keys.map((k) => ordersByKey[k]),
        sqft: keys.map((k) => Math.round(sqftByKey[k] * 100) / 100),
      },
    });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
