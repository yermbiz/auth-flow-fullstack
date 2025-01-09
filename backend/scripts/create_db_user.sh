#!/bin/bash

# find out which env ("development" by default)
ENV=${1:-development}
ENV_PATH="$(cd "$(dirname "$0")" && cd .. && pwd)/.env.$ENV"

echo "Using environment: $ENV"
echo "Resolved .env path: $ENV_PATH"

# check whether .env file exist
if [ ! -f "$ENV_PATH" ]; then
  echo "Error: .env file not found at $ENV_PATH"
  exit 1
fi

# loading env vars
export $(grep -v '^#' "$ENV_PATH" | xargs)

echo "Loaded DB_NAME: $DB_NAME"
echo "Loaded DB_USER: $DB_USER"
echo "Loaded DB_PASSWORD: $DB_PASSWORD"

# check db required vars
if [[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
  echo "Error: Missing required environment variables (DB_NAME, DB_USER, DB_PASSWORD)"
  exit 1
fi

# creating db
psql -v ON_ERROR_STOP=1 <<EOF
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
\gexec
EOF

psql -v ON_ERROR_STOP=1 <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER') THEN
        EXECUTE format('CREATE USER %I WITH PASSWORD %L', '$DB_USER', '$DB_PASSWORD');
        RAISE NOTICE 'User "%" created successfully.', '$DB_USER';
    ELSE
        RAISE NOTICE 'User "%" already exists.', '$DB_USER';
    END IF;
END
\$\$;
EOF

psql -v ON_ERROR_STOP=1 <<EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "Configuration for $ENV environment completed successfully."
