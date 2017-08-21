const getUrl = id => `http://www.ccma.cat/tv3/programacio/canal-${id}/`;

module.exports = {
  tv3: {title: 'TV3', url: getUrl('tv3')},
  324: {title: '3/24', url: getUrl('324')},
  super3: {title: 'Super3', url: getUrl('super3')},
  33: {title: '33', url: getUrl('33')},
  esport3: {title: 'Esport3', url: getUrl('esport3')},
  tv3cat: {title: 'TV3Cat', url: getUrl('tv3cat')}
};