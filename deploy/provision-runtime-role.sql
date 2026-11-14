\getenv runtime_password FAIZA_RUNTIME_DB_PASSWORD

SELECT format('CREATE ROLE faiza_runtime LOGIN PASSWORD %L', :'runtime_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='faiza_runtime')
\gexec

ALTER ROLE faiza_runtime WITH LOGIN PASSWORD :'runtime_password';
GRANT CONNECT ON DATABASE faiza_cash TO faiza_runtime;
GRANT USAGE ON SCHEMA public TO faiza_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO faiza_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faiza_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE faiza_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO faiza_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE faiza_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO faiza_runtime;
