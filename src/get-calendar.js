const ical = require('ical-generator');
const getEpisodes = require('./get-episodes');

module.exports = async channel => {
  console.log(`Retrieving episodes for "${channel.title}"...`);
  const calendar = ical({name: `Programació del canal ${channel.title}`});
  (await getEpisodes(channel.url)).forEach(episode => {
    calendar.createEvent({
      start: episode.start,
      end: episode.end,
      summary: (() => {
        let summary = episode.program.title;
        if (episode.title) summary = `${summary} - ${episode.title}`;
        return summary;
      })(),
      description: episode.description,
      url: episode.program.url
    });
  });  
  console.log(`Episodes for "${channel.title}" retrieved`);
  return calendar;
};

