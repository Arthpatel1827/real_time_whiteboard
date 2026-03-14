-- Seed data for initial development

INSERT INTO rooms (name) VALUES ('Default Room') ON CONFLICT DO NOTHING;
INSERT INTO users (display_name, email) VALUES ('Alice', 'alice@example.com') ON CONFLICT DO NOTHING;
INSERT INTO users (display_name, email) VALUES ('Bob', 'bob@example.com') ON CONFLICT DO NOTHING;
