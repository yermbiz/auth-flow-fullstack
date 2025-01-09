exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();

    table.string('terms_version', 255).notNullable().defaultTo('v1.0');
    table.string('privacy_version', 255).notNullable().defaultTo('v1.0');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.boolean('email_confirmed').defaultTo(false);
    table.string('email_confirmation_token', 255);
    table.timestamp('email_confirmation_token_expires');

    table.boolean('google_oauth').defaultTo(false);
    table.string('nickname', 255);
    table.string('avatar', 255);

    table.timestamp('deleted_at').index();

    table.string('stripe_customer_id', 255).index();
    table.string('stripe_user_id', 512).index();
    table.string('stripe_access_token', 1024);
    table.string('stripe_refresh_token', 1024);

    table.index(['email_confirmation_token'], 'idx_email_confirmation_token');
    table.index(['created_at', 'updated_at'], 'idx_created_updated_at');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};
