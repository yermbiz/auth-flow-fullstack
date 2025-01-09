exports.up = async function (knex) {
  await knex.schema.createTable('user_policies', (table) => {
    table.integer('user_id').unsigned().notNullable();
    table
      .integer('policy_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('policies')
      .onDelete('CASCADE');
    table.timestamp('agreed_at').notNullable();
    table.primary(['user_id', 'policy_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_policies');
};
