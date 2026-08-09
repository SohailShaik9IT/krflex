const { sql } = require('./utils/db');
const { requireAuth, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error, user } = requireAuth(event);
  if (error) return error;

  if (event.httpMethod === 'GET') {
    try {
      const q = event.queryStringParameters || {};
      const from = q.from ? parseInt(q.from, 10) : null;
      const to = q.to ? parseInt(q.to, 10) : null;

      const rows = await sql`
        SELECT o.id, c.name AS customer_name, o.order_name, m.media_name AS material_name,
               o.width_ft, o.height_ft, o.sqft, o.order_date, o.delivery_datetime,
               o.delivered_datetime, o.status
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        JOIN material_stock m ON m.id = o.material_id
        WHERE (${from}::bigint IS NULL OR o.order_date >= ${from})
          AND (${to}::bigint IS NULL OR o.order_date <= ${to})
        ORDER BY o.order_date DESC
      `;
      return json(200, rows);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { customerId, orderName, materialId, widthFt, heightFt, deliveryDatetime, branchId } =
        JSON.parse(event.body || '{}');
      if (!customerId || !orderName || !materialId || !widthFt || !heightFt || !deliveryDatetime) {
        return json(400, { message: 'customerId, orderName, materialId, widthFt, heightFt, deliveryDatetime are required' });
      }
      const now = Math.floor(Date.now() / 1000);
      const rows = await sql`
        INSERT INTO orders (customer_id, order_name, material_id, width_ft, height_ft,
                             order_date, delivery_datetime, status, branch_id, created_by)
        VALUES (${customerId}, ${orderName}, ${materialId}, ${widthFt}, ${heightFt},
                ${now}, ${deliveryDatetime}, 'In Progress', ${branchId || null}, ${user.sub})
        RETURNING *
      `;
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
        VALUES (${user.sub}, 'Order Created', 'Order', ${rows[0].id}, ${orderName}, ${now})
      `;
      return json(200, rows[0]);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  return json(405, { message: 'Method not allowed' });
};
