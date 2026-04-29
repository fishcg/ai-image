-- Migration 006: API Keys
-- Usage: mysql -u root -p ai_image < migrations/006_api_keys.sql

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  api_key CHAR(43) NOT NULL,
  api_key_hash CHAR(64) NOT NULL,
  key_prefix CHAR(8) NOT NULL,
  name VARCHAR(64) DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user (user_id),
  UNIQUE KEY uk_key_hash (api_key_hash),
  CONSTRAINT fk_apikeys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration 006 complete: api_keys table created' AS status;