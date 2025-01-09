exports.up = async function (knex) {
  await knex.schema.createTable('policies', (table) => {
    table.increments('id').primary();
    table.string('version', 20).notNullable();
    table.string('type', 50).notNullable();
    table.text('content').notNullable();
    table.date('effective_date').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('policies');
};
