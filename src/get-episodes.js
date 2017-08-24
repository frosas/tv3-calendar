const moment = require('moment-timezone');
const debug = require('debug')('app:getEpisodes:debug');
const Browser = require('./browser');

const ABORT_OPTIONAL_REQUESTS = false;

const browser = new Browser();

const getAcceptedTypes = request => {
  return request.headers.get('Accept')
    .split(',') // 'a/b;q=1,c/d' -> ['a/b;q=1', 'c/d']
    .map(item => item.match(/([^;]*)/) && RegExp.$1); // 'a/b;q=1' -> 'a/b'
}

const onRequest = request => {
  const acceptedTypes = getAcceptedTypes(request);
  const isOptionalRequest = 
    acceptedTypes.some(type => type.match(/^image\//)) &&
    !acceptedTypes.some(type => type == 'text/html') ||
    acceptedTypes.some(type => type == 'text/css');
  const context = {url: request.url, acceptedTypes};
  if (isOptionalRequest) {
    debug('Aborting request', context);
    request.abort();
  } else {
    debug('Continuing request', context);
    request.continue();          
  }
};

const usePage = async callback => {
  const page = await browser.createPage();
  if (ABORT_OPTIONAL_REQUESTS) {
    await page.setRequestInterceptionEnabled(true);
    page.on('request', onRequest);
  }
  try {
    return await callback(page);
  } finally {
    if (ABORT_OPTIONAL_REQUESTS) {
      // Stop intercepting requests as calling abort() or continue() on them after
      // the page is closed triggers unhandleable rejections.
      page.removeListener('request', onRequest);
    }
    await page.close();
  }
};

const getPageActiveDayEpisodesData = async page => {
  return (await page.evaluate(() => {
    return [].slice.call(document.querySelectorAll('.tab-pane.active .programes li')).map(el => {
      return {
        start: el.querySelector('.hora-programa time').getAttribute('datetime'),
        program: (() => {
          const pEl = el.querySelector('.informacio-programa p:nth-child(1)');
          return {
            title: pEl.textContent,
            url: (() => {
              const aEl = pEl.querySelector('a');
              if (aEl) return new URL(aEl.getAttribute('href'), location).toString();
            })()
          };
        })(),
        title: el.querySelector('.informacio-programa p:nth-child(2)').textContent,
        description: el.querySelector('.mostraInfo p').textContent.trim()
      };
    })
  }));    
};

const getPageData = async channelUrl => {
  return await usePage(async page => {
    await page.goto(channelUrl);
    return await getPageActiveDayEpisodesData(page);
  });
};

module.exports = async channelUrl => {
  return (await getPageData(channelUrl))
    .map(episode => ({
      ...episode,
      start: moment.tz(episode.start, 'Europe/Madrid').toDate()
    }))
    .map((episode, i, episodes) => {
      return {
        ...episode,
        end: (() => {
          const next = episodes[i + 1];
          if (next) return next.start;
          // Assume the last program of the day ends at the same time of the start 
          // of the first program of that day.
          const date = new Date(episodes[0].start);
          date.setDate(date.getDate() + 1);
          return date;
        })()
      };
    });
};