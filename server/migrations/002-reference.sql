INSERT INTO characters (id, name, role, category, description, image_key, image_alt, image_position, accent, position) VALUES
  ('v', 'V', 'Mercenary', 'merc', 'Relic carrier · Afterlife regular', 'v', 'V seated in a dark Night City apartment', 'center 30%', 'yellow', 1),
  ('johnny-silverhand', 'Johnny Silverhand', 'Rockerboy / Rebel', 'rockerboy', 'Rockerboy · Rebel · Digital ghost', 'johnny-silverhand', 'Johnny Silverhand standing beneath cold blue lights', 'center 28%', 'cyan', 2),
  ('judy-alvarez', 'Judy Alvarez', 'Braindance Technician', 'tech', 'Braindance tech · Mox ally', 'judy-alvarez', 'Judy Alvarez standing against a dark background', 'center top', 'red', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), category = VALUES(category), description = VALUES(description),
  image_key = VALUES(image_key), image_alt = VALUES(image_alt), image_position = VALUES(image_position), accent = VALUES(accent);

INSERT INTO districts (id, name, description, position) VALUES
  ('watson', 'Watson', 'Markets & megabuildings', 1),
  ('westbrook', 'Westbrook', 'Luxury & neon nightlife', 2),
  ('pacifica', 'Pacifica', 'Broken dreams & gangs', 3),
  ('heywood', 'Heywood', 'Community & street culture', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO outing_templates (id, district_id, title, prompt, position) VALUES
  ('watson-market-detail', 'watson', 'A detail in the market', 'Walk through a market in Watson. Pick a stall, sign, or object you would normally pass by. What does it tell you about the people who spend their day there?', 1),
  ('westbrook-japantown-stop', 'westbrook', 'Somewhere to stop', 'Take a walk through Japantown and find a spot that makes you want to stop. What caught your attention there?', 2),
  ('pacifica-quiet-corner', 'pacifica', 'A quiet corner', 'Find a quiet spot in Pacifica. Pause there for a moment and notice what you can hear. Which sound would you remember after leaving?', 3),
  ('heywood-meeting-place', 'heywood', 'A place to meet', 'Walk a block in Heywood and choose a place you would use to meet a friend. What makes it easy to recognize?', 4)
ON DUPLICATE KEY UPDATE district_id = VALUES(district_id), title = VALUES(title), prompt = VALUES(prompt);

INSERT INTO character_dilemmas (character_id, question, position) VALUES
  ('v', 'When a contract clashes with your conscience, where should V draw the line?', 1),
  ('johnny-silverhand', 'Does fighting a corrupt system excuse the harm done along the way?', 2),
  ('judy-alvarez', 'When is staying to help worth the cost of giving up a fresh start?', 3)
ON DUPLICATE KEY UPDATE question = VALUES(question);

INSERT INTO fan_poll_options (id, character_id, label, symbol, position) VALUES
  ('johnny-silverhand', 'johnny-silverhand', 'Johnny', 'heart', 1),
  ('judy-alvarez', 'judy-alvarez', 'Judy', 'star', 2),
  ('panam-palmer', NULL, 'Panam', 'heart', 3)
ON DUPLICATE KEY UPDATE character_id = VALUES(character_id), label = VALUES(label), symbol = VALUES(symbol);

INSERT INTO discussions (id, seed_author, title, body, tag, spoiler, accent, character_id, district_id, created_at) VALUES
  ('hardest-ending', 'netrunner77', 'Which ending hit you the hardest?', 'I keep coming back to the Star ending. The contrast between Night City and freedom outside the walls is brutal.', 'Story', TRUE, 'cyan', NULL, NULL, '2025-01-01 12:00:00'),
  ('screenshot-locations', 'mox_judy', 'Best place for screenshots in Night City?', 'Japantown at night is unbeatable, but the Badlands at sunrise deserves more love.', 'Night City', FALSE, 'red', NULL, 'westbrook', '2025-01-01 11:00:00'),
  ('johnny-hero-villain', 'samurai_fan', 'Johnny: hero, villain, or both?', 'He is selfish, charismatic and destructive — but that is exactly why the character works so well.', 'Characters', FALSE, 'yellow', 'johnny-silverhand', NULL, '2025-01-01 10:00:00')
ON DUPLICATE KEY UPDATE id = VALUES(id);
