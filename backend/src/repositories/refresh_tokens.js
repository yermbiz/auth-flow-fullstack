const getDb = require('../../db/knex');
const knex = getDb();

const saveRefreshToken = async ({ userId, token }, trx = null) => {
  const query = knex('refresh_tokens')
    .insert({
      user_id: userId,
      token,
      created_at: knex.fn.now(),
    });

  return trx ? query.transacting(trx) : query;
};
module.exports = {
  saveRefreshToken,
};
