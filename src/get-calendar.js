const ical = require('ical-generator');
const getEpisodes = require('./get-episodes');

module.exports = async () => {
  console.log('Retrieving episodes...');
  const calendar = ical({name: 'Programació de TV3'});
  (await getEpisodes()).forEach(episode => {
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
  console.log('Episodes retrieved');
  return calendar;
};

