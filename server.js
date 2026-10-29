// DEPENDENCIES
const app = require("./app.js");

// CONFIGURATION
require("dotenv").config();
const PORT = process.env.PORT;

// LISTEN
app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`Listening on port ${PORT}`);
});
