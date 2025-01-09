exports.up = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash').nullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('password_hash').notNullable().alter();
  });
};
