// All SQL for the dishes table. `db` is either the pool or a client inside a transaction.
// Columns are aliased to the camelCase field names used by the API.

const DISH_COLUMNS = `
  dish_id      AS "dishId",
  dish_name    AS "dishName",
  image_url    AS "imageUrl",
  is_published AS "isPublished",
  version
`;

export async function findAll(db) {
  const { rows } = await db.query(`SELECT ${DISH_COLUMNS} FROM dishes ORDER BY dish_id`);
  return rows;
}

export async function findById(db, dishId) {
  const { rows } = await db.query(`SELECT ${DISH_COLUMNS} FROM dishes WHERE dish_id = $1`, [dishId]);
  return rows[0] ?? null;
}

// Locks the row until the surrounding transaction ends, so concurrent updates of the same dish wait in line.
export async function findByIdForUpdate(client, dishId) {
  const { rows } = await client.query(`SELECT ${DISH_COLUMNS} FROM dishes WHERE dish_id = $1 FOR UPDATE`, [dishId]);
  return rows[0] ?? null;
}

// Stores the explicit values sent by the client and bumps the version by exactly one.
export async function updateNameAndStatus(client, dishId, { dishName, isPublished }) {
  const { rows } = await client.query(
    `UPDATE dishes
        SET dish_name = $2,
            is_published = $3,
            version = version + 1,
            updated_at = now()
      WHERE dish_id = $1
      RETURNING ${DISH_COLUMNS}`,
    [dishId, dishName, isPublished]
  );
  return rows[0];
}
