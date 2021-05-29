const target = 'local'; // local | dev | prod

module.exports = {
  firebase: require('./__config__/firebase.json')[target],
  daily: require('./__config__/daily.json')[target],
  mux: require('./__config__/mux.json')[target],
  easy: require('./__config__/easy.json')[target],
  stripe: require('./__config__/stripe.json')[target]
};
