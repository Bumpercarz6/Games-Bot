/***********************
 * REQUIRED LIBRARIES
 ***********************/
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { google } = require("googleapis");

/***********************
 * DISCORD CLIENT
 ***********************/
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/***********************
 * GOOGLE AUTH
 ***********************/
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

/***********************
 * CONFIG
 ***********************/
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RESULTS_SHEET = "Results"; // must exist

/***********************
 * READY — REGISTER COMMAND
 ***********************/
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  await client.application.commands.create({
    name: "final",
    description: "Enter a final WHL game result",
    options: [
      { name: "date", description: "YYYY-MM-DD", type: 3, required: true },
      { name: "home", description: "Home team", type: 3, required: true },
      { name: "away", description: "Away team", type: 3, required: true },
      { name: "home_score", description: "Home score", type: 4, required: true },
      { name: "away_score", description: "Away score", type: 4, required: true },
      {
        name: "status",
        description: "Final / OT / SO",
        type: 3,
        required: true,
        choices: [
          { name: "Final", value: "FINAL" },
          { name: "OT", value: "OT" },
          { name: "SO", value: "SO" }
        ]
      }
    ]
  });

  console.log("✅ /final command registered");
});

/***********************
 * COMMAND HANDLER
 ***********************/
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "final") return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const date = interaction.options.getString("date");
    const home = interaction.options.getString("home");
    const away = interaction.options.getString("away");
    const homeScore = interaction.options.getInteger("home_score");
    const awayScore = interaction.options.getInteger("away_score");
    const status = interaction.options.getString("status");

    const row = [
      date,
      home,
      away,
      homeScore,
      awayScore,
      status
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RESULTS_SHEET}!A:F`,
      valueInputOption: "RAW",
      requestBody: {
        values: [row]
      }
    });

    await interaction.editReply("✅ Result saved to sheet.");
    console.log("✅ Result written:", row);

  } catch (err) {
    console.error("❌ RESULT ERROR:", err);
    await interaction.editReply("❌ Failed to write result. Check logs.");
  }
});

/***********************
 * LOGIN
 ***********************/
client.login(process.env.DISCORD_TOKEN);
