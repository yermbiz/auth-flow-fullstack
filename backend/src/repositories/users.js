const getDb = require('../../db/knex');
const knex = getDb();

const getByEmail = async (email, trx = null) => {
  const query = knex('users')
    .where('email', email)
    .select('*')
    .first();
  return trx ? query.transacting(trx) : query;
};

const getById = async (id, trx = null) => {
  const query = knex('users').where({ id }).first();
  return trx ? query.transacting(trx) : query;
}

const getByNickname = async (nickname, trx = null) => {
  const query = knex('users')
    .where({ nickname })
    .first();
  return trx ? query.transacting(trx) : query;
};

const create = async ({
  email,
  nickname,
  password_hash = null,
  terms_version,
  privacy_version,
  google_oauth = false,
  email_confirmed = false,
}, trx = null) => {
  const accepted_policies = terms_version && privacy_version ? true : false;

  const query = knex('users')
    .insert({
      email,
      nickname,
      password_hash,
      terms_version,
      privacy_version,
      google_oauth,
      email_confirmed,
      accepted_policies,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning('id');

  return trx ? query.transacting(trx) : query;
};

const getFieldsByUserId = async (userId, fields) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('Fields must be a non-empty array');
  }

  return knex('users')
    .where({ id: userId })
    .select(fields)
    .first();
};

const getByEmailConfirmationToken = async (token) => {
  return knex('users')
      .where({ email_confirmation_token: token })
      .andWhere('email_confirmation_token_expires', '>', new Date())
      .first();
}

const updateById = async (id, fields, trx = null) => {
  const query = knex('users').where({ id }).update(fields);
  return trx ? query.transacting(trx) : query;
};


module.exports = {
  getByEmail,
  getById,
  getByNickname,
  create,
  getFieldsByUserId,
  getByEmailConfirmationToken,
  updateById
};
