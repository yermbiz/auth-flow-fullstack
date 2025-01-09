exports.up = function(knex) {
  return knex.schema.createTable('password_reset_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('reset_token', 256).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('consumed_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('password_reset_tokens');
};
