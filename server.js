const express = require("express");
const pkg = require("./package.json");

const app = express();
const PORT = process.env.PORT || 3000;
const GREETING = process.env.APP_GREETING || "(APP_GREETING not set)";

app.get("/", (req, res) => {
  res.send(`
    <h1>Replit Sync Demo v1.0.1-replit</h1>
    <p>Version: <b>${pkg.version}</b></p>
    <p>Greeting from secret: <b>${GREETING}</b></p>
    <p>Running on: <b>${process.env.REPL_ID ? "Replit" : "local machine"}</b></p>
  `);
});

app.get("/health", (req, res) => res.json({ ok: true, version: pkg.version }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
