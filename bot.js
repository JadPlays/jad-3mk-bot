const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require("discord.js");

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("DISCORD_TOKEN is not set!");
  process.exit(1);
}

const SUGGESTIONS_CHANNEL = "【💡】suggestions";
const X_THRESHOLD = 4;

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if the bot is online")
    .toJSON(),
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.on("clientReady", async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  const rest = new REST().setToken(token);
  try {
    await rest.put(Routes.applicationCommands(readyClient.user.id), { body: commands });
    console.log("Slash commands registered");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ping") {
    await interaction.reply("🟢 I'm online and running!");
  }
});

client.on("threadCreate", async (thread) => {
  if (thread.parent?.name !== SUGGESTIONS_CHANNEL) return;
  try {
    const startMessage = await thread.fetchStarterMessage();
    if (!startMessage) return;
    await startMessage.react("⭐");
    await startMessage.react("❌");
  } catch (err) {
    console.error("Failed to react to forum post:", err);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  try {
    if (user.bot) return;
    if (reaction.emoji.name !== "❌") return;
    if (reaction.partial) await reaction.fetch();
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
    const thread = message.channel;
    if (!thread.isThread()) return;
    if (thread.parent?.name !== SUGGESTIONS_CHANNEL) return;
    const xReaction = message.reactions.cache.get("❌");
    const count = xReaction?.count ?? 0;
    if (count >= X_THRESHOLD) {
      await thread.delete("Reached 4 ❌ reactions");
      console.log(`Deleted forum post ${thread.id} — 4 ❌ reached`);
    }
  } catch (err) {
    console.error("Failed to handle reaction:", err);
  }
});

client.on("error", console.error);
client.login(token);

const http = require("http");
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("I'm alive");
}).listen(PORT, () => console.log(`HTTP server listening on port ${PORT}`));
