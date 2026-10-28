const db = require('../db/dbConfig.js');

const getAllEvents = (userId) => db.any('SELECT * FROM events WHERE user_id = $1 ORDER BY id DESC', [userId]);
const getEvent = (userId, eventId) => db.oneOrNone('SELECT * FROM events WHERE user_id = $1 AND id = $2', [userId, eventId]);
const newEvent = (userId, event) => db.one(
  'INSERT INTO events (artist, venue, city, artist_picture, price, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
  [event.artist, event.venue, event.city, event.artist_picture, event.price, userId]
);
const updateEvent = (userId, eventId, event) => db.oneOrNone(
  'UPDATE events SET artist=$1, venue=$2, city=$3, artist_picture=$4, price=$5 WHERE user_id=$6 AND id=$7 RETURNING *',
  [event.artist, event.venue, event.city, event.artist_picture, event.price, userId, eventId]
);
const deleteEvent = (userId, eventId) => db.oneOrNone(
  'DELETE FROM events WHERE user_id=$1 AND id=$2 RETURNING *', [userId, eventId]
);
module.exports = { getAllEvents, getEvent, newEvent, updateEvent, deleteEvent };
