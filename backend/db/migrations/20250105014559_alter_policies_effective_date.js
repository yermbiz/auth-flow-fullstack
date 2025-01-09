exports.up = async function (knex) {
  await knex.schema.alterTable('policies', (table) => {
    table.timestamp('effective_date', { useTz: true }).alter();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('policies', (table) => {
    table.date('effective_date').alter();
  });
};
