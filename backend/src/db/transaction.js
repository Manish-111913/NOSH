/**
 * Runs `work(client)` inside a single database transaction.
 * Commits when `work` resolves, rolls back when it throws, and always releases the client.
 */
export async function withTransaction(pool, work) {
  const client = await pool.connect();
  let releaseError;

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // The connection is broken; destroy it instead of returning it to the pool.
      releaseError = rollbackError;
    }
    throw err;
  } finally {
    client.release(releaseError);
  }
}
