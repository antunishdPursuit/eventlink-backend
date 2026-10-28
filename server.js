// DEPENDENCIES
const app = require("./app.js");

// CONFIGURATION
require("dotenv").config();
const PORT = process.env.PORT;

// LISTEN
app.listen(PORT, process.env.HOST || undefined, () => {
  console.log(`Listening on port ${PORT}`);
});
