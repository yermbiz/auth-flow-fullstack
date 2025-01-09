exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('accepted_policies').defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('accepted_policies');
  });
};
