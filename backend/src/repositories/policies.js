const getDb = require('../../db/knex');
const knex = getDb();

const getByTypeAndVersion = async (type, version) => {
  return knex('policies')
  .where({ type, version })
  .first();
}

const getLatestPolicies = async () => {
  return knex('policies')
    .select('type', 'version', 'content', 'effective_date')
    .where('effective_date', '<=', knex.fn.now())
    .orderBy(['type', { column: 'effective_date', order: 'desc' }]) // Correct ordering
    .distinctOn('type'); // Select distinct types with the latest effective_date
};


const saveUserAgreement = async (userId, policyIds) => {
  const records = policyIds.map((policyId) => ({
    user_id: userId,
    policy_id: policyId,
    agreed_at: new Date(),
  }));

  await knex('user_policies').insert(records);
};

module.exports = {
  getLatestPolicies,
  saveUserAgreement,
  getByTypeAndVersion
}