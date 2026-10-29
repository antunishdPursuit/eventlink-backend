const express = require("express");
const users = express.Router();
const { getAllUsers, getUser, createUser, deleteUser, updateUser } = require("../queries/users");
const { checkBoolean, checkName, validatePhoto } = require("../validations/checkUsers.js");
const db = require('../db/dbConfig');

//Events controller to be used at a later point
const eventsController = require("./eventsController.js");
users.use("/:user_Id/events", eventsController);

function requireOwner(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Sign in first.' });
  if (String(req.session.userId) !== req.params.id) return res.status(403).json({ error: 'Not allowed.' });
  next();
}


// INDEX
users.get("/", async (req, res) => {
  const allUsers = await getAllUsers();

  if (Array.isArray(allUsers)) {
    res.status(200).json(allUsers);
  } else {
    res.status(500).json({ error: "Show All Users error" });
  }
});


// SHOW
users.get("/:id", async (req, res) => {
  const { id } = req.params;
  const user = await getUser(id);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "Show one User failed" });
  }
});

// CREATE
users.post("/", (req, res) => res.status(401).json({ error: 'Create a profile with a password.' }));

// Delete
users.delete("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;
  const deletedUser = await deleteUser(id);

  if (deletedUser.id) {
    req.session.destroy(error => error ? res.status(500).json({ error: 'Unable to sign out.' }) : res.status(200).json(deletedUser));
  } else {
    res.status(404).json("User not found");
  }
});

// UPDATE
users.put("/:id", requireOwner, checkName, checkBoolean, validatePhoto, async (req, res) => {
  const { id } = req.params;
  const { profile_picture, username, bio, looking_for_group, date_created } = req.body;
  try {
    const updatedUser = await db.tx(async tx => {
      const user = await tx.oneOrNone('UPDATE users SET profile_picture=$1, username=$2, bio=$3, looking_for_group=$4, date_created=$5 WHERE id=$6 RETURNING *',
        [profile_picture, username.trim(), bio, looking_for_group, date_created, id]);
      if (user) await tx.none('UPDATE local_credentials SET login_name=$1 WHERE user_id=$2', [username.trim().toLowerCase(), id]);
      return user;
    });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'That username is unavailable.' : 'Unable to update profile.' });
  }
});


module.exports = users;
