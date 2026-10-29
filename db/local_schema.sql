-- Run against a new, empty database. Existing tables and data are preserved.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  profile_picture TEXT,
  username TEXT NOT NULL,
  bio TEXT DEFAULT 'Excited for Future Concerts',
  looking_for_group BOOLEAN,
  date_created DATE
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  artist TEXT,
  venue TEXT,
  city TEXT,
  artist_picture TEXT,
  price NUMERIC,
  user_id INTEGER REFERENCES users (id) ON DELETE CASCADE
);
