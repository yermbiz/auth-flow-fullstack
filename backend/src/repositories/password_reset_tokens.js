const getDb = require('../../db/knex');
const knex = getDb();

const saveResetToken = async ({
    user_id,
    reset_token,
    expires_at,
}, trx = null) => {
  const query = knex('password_reset_tokens').insert({
      user_id,
      reset_token,
      expires_at,
      created_at: new Date(),
    });

  return trx ? query.transacting(trx) : query;
};

const getByToken = async(token) => {
  return knex('password_reset_tokens')
      .where({ reset_token: token })
      .first();
}

const deleteByToken = async(token) => {
   return knex('password_reset_tokens').where({ reset_token: token }).del();
}

module.exports = {
  saveResetToken,
  getByToken,
  deleteByToken
};
