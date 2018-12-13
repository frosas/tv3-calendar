const express = require("express");
const nodeUtil = require("util");
const log = require("debug")("app:index");
const util = require("./util");
const getCalendar = require("./get-calendar");
const channels = require("./channels");

const MINUTES = 60 * 1000;

// Show stack trace and end process
process.on("unhandledRejection", error => {
  throw error;
});

const getCalendarRetryingly = util.retryify(
  async ({ error, attempt, args }) => {
    if (error) console.error(error);
    if (attempt > 1) await util.delay(10 /* seconds */ * 1000);
    return getCalendar(...args);
  }
);

(async () => {
  const whenCalendarsByChannel = {};
  const updateChannelCalendarContinuously = async (id, channel) => {
    await (whenCalendarsByChannel[id] = getCalendarRetryingly(channel));
    const delay = 10 * MINUTES;
    log(
      `Sleeping for ${delay / MINUTES} minutes until next channel "${
        channel.title
      }" calendar retrieval...`
    );
    setTimeout(() => updateChannelCalendarContinuously(id, channel), delay);
  };
  Object.entries(channels).forEach(([id, channel]) => {
    updateChannelCalendarContinuously(id, channel);
  });

  // Note we start the server without waiting for the calendar to be obtained.
  // Instead, we use its promise to serve it once it resolves.
  log("Starting web server...");
  const app = express();
  app.set("views", `${__dirname}/views`);
  app.set("view engine", "ejs");
  app.get("/", (req, res) => res.render("index", { channels }));
  app.get("/ics", (req, res) => res.redirect("/ics/tv3"));
  app.get("/ics/:channelId", async (req, res) => {
    (await whenCalendarsByChannel[req.params.channelId]).serve(res);
  });
  await nodeUtil.promisify(app.listen.bind(app))(process.env.PORT || 80);
  log("Web server started");
})();
