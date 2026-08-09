const { sql } = require('./utils/db');
const { requireAuth, requireAdmin, json, CORS_HEADERS } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  if (event.httpMethod === 'GET') {
    const { error } = requireAuth(event);
    if (error) return error;
    try {
      const rows = await sql`SELECT * FROM material_stock ORDER BY media_name`;
      return json(200, rows);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  if (event.httpMethod === 'POST') {
    const { error, user } = requireAdmin(event);
    if (error) return error;
    try {
      const { mediaName, size, noOfRolls, mediaBrand, branchId } = JSON.parse(event.body || '{}');
      if (!mediaName || !size || !mediaBrand) {
        return json(400, { message: 'mediaName, size, mediaBrand are required' });
      }
      const now = Math.floor(Date.now() / 1000);
      const rows = await sql`
        INSERT INTO material_stock (media_name, size, no_of_rolls, media_brand, branch_id, updated_at)
        VALUES (${mediaName}, ${size}, ${noOfRolls || 0}, ${mediaBrand}, ${branchId || null}, ${now})
        RETURNING *
      `;
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
        VALUES (${user.sub}, 'Material Added', 'MaterialStock', ${rows[0].id}, ${mediaName + ' (' + (noOfRolls || 0) + ' rolls)'}, ${now})
      `;
      return json(200, rows[0]);
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  if (event.httpMethod === 'DELETE') {
    const { error, user } = requireAdmin(event);
    if (error) return error;
    try {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) return json(400, { message: 'id is required' });

      const existing = await sql`SELECT * FROM material_stock WHERE id = ${id}`;
      if (!existing.length) return json(404, { message: 'Material not found' });

      const inUse = await sql`SELECT id FROM orders WHERE material_id = ${id} LIMIT 1`;
      if (inUse.length) {
        return json(409, { message: 'Cannot delete: this material is used by existing orders' });
      }

      await sql`DELETE FROM material_stock WHERE id = ${id}`;
      const now = Math.floor(Date.now() / 1000);
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, logged_at)
        VALUES (${user.sub}, 'Material Deleted', 'MaterialStock', ${id}, ${existing[0].media_name}, ${now})
      `;
      return json(200, { ok: true });
    } catch (err) {
      console.error(err);
      return json(500, { message: 'Server error', detail: String(err) });
    }
  }

  return json(405, { message: 'Method not allowed' });
};
