const express = require('express');
const axios = require('axios');

const discovery = express.Router();

discovery.get('/events', async (req, res) => {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return res.status(503).json({ error: 'Event search is unavailable' });
  const { stateCode, postalCode, classificationName } = req.query;
  if ([stateCode, postalCode, classificationName, req.query.size].some(value => value !== undefined && typeof value !== 'string') ||
      (stateCode && !/^[A-Za-z]{2}$/.test(stateCode)) ||
      (postalCode && !/^\d{5}$/.test(postalCode)) ||
      (stateCode && postalCode) ||
      (classificationName && classificationName !== 'music')) {
    return res.status(400).json({ error: 'Invalid search' });
  }
  const size = Math.min(10, Math.max(1, Number.parseInt(req.query.size, 10) || 10));
  try {
    const params = { apikey: key, size };
    if (stateCode) params.stateCode = stateCode.toUpperCase();
    if (postalCode) params.postalCode = postalCode;
    if (classificationName) params.classificationName = classificationName;
    const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { params, timeout: 10000 });
    res.json({ events: response.data._embedded?.events || [] });
  } catch (_) {
    res.status(502).json({ error: 'Event search is unavailable' });
  }
});

module.exports = discovery;
