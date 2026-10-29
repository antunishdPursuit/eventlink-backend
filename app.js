// DEPENDENCIES
const cors = require("cors");
const express = require("express");
const session = require('express-session');
const { randomBytes } = require('crypto');

// CONFIGURATION
const app = express();

// MIDDLEWARE
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:3225';
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(session({
  name: 'eventlink.sid',
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 60 * 60 * 1000 }
}));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('origin') !== frontendOrigin) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  next();
});
app.use('/auth', require('./auth/routes'));
app.use('/api', require('./controllers/discoveryController'));

// ROUTES
app.get("/", (req, res) => {
  res.send("Welcome to the Events App");
});

// users ROUTES
const usersController = require("./controllers/usersController.js");
app.use("/users", usersController);

// 404 PAGE
app.get("*", (req, res) => {
  res.status(404).send("Page not found");
});

// EXPORT
module.exports = app;
