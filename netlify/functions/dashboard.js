const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAuth(event);
  if (error) return error;

  try {
    const period = (event.queryStringParameters && event.queryStringParameters.period) || 'daily';
    const now = new Date();
    let start;
    switch (period.toLowerCase()) {
      case 'weekly':
        start = new Date(now); start.setDate(start.getDate() - 7); break;
      case 'monthly':
        start = new Date(now); start.setMonth(start.getMonth() - 1); break;
      case 'yearly':
        start = new Date(now); start.setFullYear(start.getFullYear() - 1); break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of today
    }
    const startEpoch = Math.floor(start.getTime() / 1000);
    const nowEpoch = Math.floor(now.getTime() / 1000);
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const [{ count: employeesToday }] = await sql`
      SELECT COUNT(*)::int AS count FROM attendance
      WHERE work_date = ${today} AND status = 'Present'
    `;

    const [{ count: totalCustomers }] = await sql`SELECT COUNT(*)::int AS count FROM customers`;

    const [{ sqft, orders }] = await sql`
      SELECT COALESCE(SUM(sqft), 0)::float AS sqft, COUNT(*)::int AS orders
      FROM orders
      WHERE order_date >= ${startEpoch} AND order_date <= ${nowEpoch}
    `;

    return json(200, {
      employeesWorkingToday: employeesToday,
      totalCustomers,
      totalSqftSold: sqft,
      totalOrders: orders,
      period,
    });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
