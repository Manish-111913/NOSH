-- Executed once by the postgres Docker image when its data volume is first created.
-- nosh_test: backend integration tests (Vitest). nosh_e2e: browser tests (Playwright).
CREATE DATABASE nosh_test OWNER nosh;
CREATE DATABASE nosh_e2e OWNER nosh;
