const express = require('express');
const events = express.Router({ mergeParams: true });
const { getAllEvents, getEvent, newEvent, deleteEvent, updateEvent } = require('../queries/events');

function handler(operation, status = 200) {
  return async (req, res) => {
    try {
      const result = await operation(req);
      if (result === null) return res.status(404).json({ error: 'Event not found' });
      return res.status(status).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Unable to process events' });
    }
  };
}
events.get('/', handler(req => getAllEvents(req.params.user_Id)));
events.get('/:eventid', handler(req => getEvent(req.params.user_Id, req.params.eventid)));
events.post('/', handler(req => newEvent(req.params.user_Id, req.body), 201));
events.put('/:eventid', handler(req => updateEvent(req.params.user_Id, req.params.eventid, req.body)));
events.delete('/:eventid', handler(req => deleteEvent(req.params.user_Id, req.params.eventid)));
module.exports = events;
