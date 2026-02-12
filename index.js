require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { google } = require("googleapis");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/**********************
 * CONFIG
 **********************/
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RESULTS_SHEET = "Results";
const CHANNEL_ID = process.env.GAMES_CHANNEL_ID;
const TIMEZONE = "America/Edmonton";

/**********************
 * GOOGLE AUTH
 **********************/
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

/**********************
 * GET TODAY DATE
 **********************/
function todayISO() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: TIMEZONE,
  });
}

/**********************
 * FETCH TODAY GAMES
 **********************/
async function getTodayGames() {
  const date = todayISO();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${RESULTS_SHEET}!A2:C`, // Date, Home, Away only
  });

  const rows = res.data.values || [];

  return rows.filter(r => r[0] === date);
}

/**********************
 * POST GAMES
 **********************/
async function postGames() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const games = await getTodayGames();
  const date = todayISO();

  if (!games.length) {
    await channel.send(`🏒 **${date}**\nNo games today.`);
    return;
  }

  let message = `🏒 **WHL Games — ${date}**\n\n`;

  games.forEach(g => {
    const [, home, away] = g;
    message += `${away} @ ${home}\n`;
  });

  await channel.send(message);
}

/**********************
 * READY
 **********************/
client.once("ready", async () => {
  console.log("Morning Games Bot Ready");

  await postGames();
  process.exit(0); // VERY important for Railway cron
});

/**********************
 * LOGIN
 **********************/
client.login(process.env.BOT_TOKEN);
