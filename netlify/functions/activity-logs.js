const { sql } = require('./utils/db');
const { requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  const { error } = requireAdmin(event);
  if (error) return error;

  try {
    const q = event.queryStringParameters || {};
    const name = (q.name || '').trim();
    const mobile = (q.mobile || '').trim();
    const namePattern = name ? `%${name}%` : null;
    const mobilePattern = mobile ? `%${mobile}%` : null;

    // Order-tracker activity only (Order Created / Order Status Changed),
    // with acting user + linked customer for name/mobile search.
    const rows = await sql`
      SELECT
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.logged_at,
        u.username,
        u.full_name AS employee_name,
        c.name AS customer_name,
        c.mobile AS customer_mobile,
        o.order_name
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN orders o ON al.entity_type = 'Order' AND o.id = al.entity_id
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE al.entity_type = 'Order'
        AND (${namePattern}::text IS NULL OR c.name ILIKE ${namePattern})
        AND (${mobilePattern}::text IS NULL OR c.mobile ILIKE ${mobilePattern})
      ORDER BY al.logged_at DESC
      LIMIT 200
    `;
    return json(200, rows);
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Server error', detail: String(err) });
  }
};
