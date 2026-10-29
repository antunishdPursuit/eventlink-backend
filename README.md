# EventLink backend

The Express API provides profile and event data for the [EventLink frontend](https://github.com/antunishdPursuit/eventlink). It also requests event listings from Ticketmaster without sending the API key to the browser.

## Local setup

Use Node.js and PostgreSQL. Create an empty database named `events_attended_dev`, then run `db/local_schema.sql` against it. To load the original sample profiles, run `db/seed.sql` **once on a new empty database**; the sample event rows refer to the initial profile IDs. The older `db/schema.sql` drops the database, so do not run it against data you want to keep.

Set these PowerShell variables in the terminal that will run the API, substituting your own PostgreSQL credentials and Ticketmaster key:

```powershell
$env:PG_HOST = '127.0.0.1'
$env:PG_PORT = '5432'
$env:PG_DATABASE = 'events_attended_dev'
$env:PG_USER = 'your-postgres-user'
$env:PG_PASSWORD = 'your-postgres-password'
$env:TICKETMASTER_API_KEY = 'your-ticketmaster-key'
$env:HOST = '127.0.0.1'
$env:PORT = '3003'
npm ci
node server.js
```

Keep credentials outside Git and do not put the Ticketmaster key in React environment variables. The frontend's default origin is `http://127.0.0.1:3225`; set `FRONTEND_ORIGIN` in the backend environment if you intentionally use a different origin.

Passwords are hashed on the server. Sessions are kept in memory for local use and end when the server restarts. Existing sample profiles have no account owner and remain viewable; new accounts can edit only their own profiles and saved events.
