const ical = require("ical-generator");
const log = require("debug")("app:getCalendar");
const getEpisodes = require("./get-episodes");

module.exports = async channel => {
  log(`Retrieving "${channel.title}" episodes...`);
  const calendar = ical({ name: `Programació del canal ${channel.title}` });
  (await getEpisodes(channel.url)).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: (() => {
        let summary = episode.program.title;
        if (episode.title) summary = `${summary} - ${episode.title}`;
        return summary;
      })(),
      description: []
        .concat(episode.description || [])
        .concat(episode.program.url || [])
        .join("\n\n")
      // TODO Google Calendar doesn't support this field
      // url: episode.program.url
    });
  });
  log(`${calendar.events().length} "${channel.title}" episodes retrieved`);
  return calendar;
};
