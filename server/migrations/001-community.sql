CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR(36) COLLATE utf8mb4_bin PRIMARY KEY,
  username VARCHAR(24) COLLATE utf8mb4_bin NOT NULL,
  hide_spoilers BOOLEAN NOT NULL DEFAULT TRUE,
  first_community_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT profile_auth_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  role VARCHAR(60) NOT NULL,
  category ENUM('merc', 'rockerboy', 'tech') NOT NULL,
  description VARCHAR(240) NOT NULL,
  image_key VARCHAR(64) NOT NULL,
  image_alt VARCHAR(240) NOT NULL,
  image_position VARCHAR(40) NULL,
  accent ENUM('yellow', 'cyan', 'red') NOT NULL,
  position SMALLINT UNSIGNED NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS districts (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(240) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS outing_templates (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(120) NOT NULL,
  prompt VARCHAR(600) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL UNIQUE,
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS character_dilemmas (
  character_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  question VARCHAR(600) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL UNIQUE,
  FOREIGN KEY (character_id) REFERENCES characters(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fan_poll_options (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  character_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  label VARCHAR(60) NOT NULL,
  symbol ENUM('heart', 'star') NOT NULL,
  position SMALLINT UNSIGNED NOT NULL UNIQUE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorite_characters (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  character_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (user_id, character_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_districts (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (user_id, district_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fan_poll_votes (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  option_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (user_id, option_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES fan_poll_options(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS character_collection_ratings (
  user_id VARCHAR(36) COLLATE utf8mb4_bin PRIMARY KEY,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discussions (
  id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NULL,
  seed_author VARCHAR(24) NULL,
  title VARCHAR(80) NOT NULL CHECK (CHAR_LENGTH(TRIM(title)) > 0),
  body VARCHAR(360) NOT NULL CHECK (CHAR_LENGTH(TRIM(body)) > 0),
  tag ENUM('Community', 'Story', 'Night City', 'Characters') NOT NULL DEFAULT 'Community',
  spoiler BOOLEAN NOT NULL DEFAULT FALSE,
  accent ENUM('yellow', 'cyan', 'red') NOT NULL DEFAULT 'cyan',
  character_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX discussions_feed (created_at, id),
  FOREIGN KEY (author_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  CONSTRAINT discussion_author CHECK ((author_id IS NULL) <> (seed_author IS NULL))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discussion_replies (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  discussion_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  body VARCHAR(240) NOT NULL CHECK (CHAR_LENGTH(TRIM(body)) > 0),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX discussion_reply_order (discussion_id, created_at, id),
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS discussion_likes (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  discussion_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (user_id, discussion_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fan_clues (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  previous_clue_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  depth TINYINT UNSIGNED NOT NULL CHECK (depth BETWEEN 1 AND 4),
  title VARCHAR(60) NOT NULL,
  hint VARCHAR(240) NOT NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (id, district_id),
  FOREIGN KEY (author_id) REFERENCES profiles(user_id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (previous_clue_id, district_id) REFERENCES fan_clues(id, district_id),
  CHECK ((previous_clue_id IS NULL AND depth = 1) OR (previous_clue_id IS NOT NULL AND depth > 1))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS outing_runs (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  template_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  clue_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  note VARCHAR(240) NULL,
  in_game_time ENUM('day', 'night') NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  active_for VARCHAR(36) COLLATE utf8mb4_bin
    GENERATED ALWAYS AS (CASE WHEN completed_at IS NULL THEN user_id ELSE NULL END) PERSISTENT,
  UNIQUE (active_for),
  INDEX outing_history (user_id, completed_at),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES outing_templates(id),
  FOREIGN KEY (clue_id) REFERENCES fan_clues(id),
  CHECK ((template_id IS NULL) <> (clue_id IS NULL)),
  CHECK ((completed_at IS NULL) = (note IS NULL)),
  CHECK (completed_at IS NOT NULL OR in_game_time IS NULL)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_fan_clues (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  clue_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, clue_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (clue_id) REFERENCES fan_clues(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS district_journal_entries (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(240) NOT NULL CHECK (CHAR_LENGTH(TRIM(note)) > 0),
  imported BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE (user_id, district_id, source_id),
  INDEX district_journal_history (user_id, district_id, created_at),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS district_collections (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(60) NOT NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX district_collections_owner (author_id, district_id, created_at),
  FOREIGN KEY (author_id) REFERENCES profiles(user_id),
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS district_collection_items (
  collection_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position TINYINT UNSIGNED NOT NULL CHECK (position BETWEEN 1 AND 3),
  source_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(240) NOT NULL,
  note_created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (collection_id, position),
  UNIQUE (collection_id, source_id),
  FOREIGN KEY (collection_id) REFERENCES district_collections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_district_collections (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  collection_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, collection_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES district_collections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS finding_checks (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  district_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(240) NOT NULL,
  place VARCHAR(120) NOT NULL,
  in_game_time ENUM('day', 'night') NOT NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX finding_check_owner (author_id, district_id, created_at),
  FOREIGN KEY (author_id) REFERENCES profiles(user_id),
  FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS finding_observations (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  check_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  source_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  note VARCHAR(240) NOT NULL,
  in_game_time ENUM('day', 'night') NOT NULL,
  result ENUM('confirmed', 'different', 'notFound') NOT NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX finding_observation_order (check_id, created_at),
  FOREIGN KEY (check_id) REFERENCES finding_checks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES profiles(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_finding_checks (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  check_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, check_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (check_id) REFERENCES finding_checks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_finding_observations (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  observation_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, observation_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (observation_id) REFERENCES finding_observations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dilemma_responses (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  dilemma_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  body VARCHAR(240) NOT NULL CHECK (CHAR_LENGTH(TRIM(body)) > 0),
  spoiler BOOLEAN NOT NULL DEFAULT FALSE,
  revision_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, dilemma_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (dilemma_id) REFERENCES character_dilemmas(character_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dilemma_argument_shares (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  author_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  dilemma_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  body VARCHAR(240) NOT NULL,
  spoiler BOOLEAN NOT NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (author_id) REFERENCES profiles(user_id),
  FOREIGN KEY (dilemma_id) REFERENCES character_dilemmas(character_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_dilemma_arguments (
  user_id VARCHAR(36) COLLATE utf8mb4_bin NOT NULL,
  argument_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, argument_id),
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (argument_id) REFERENCES dilemma_argument_shares(id) ON DELETE CASCADE
) ENGINE=InnoDB;
