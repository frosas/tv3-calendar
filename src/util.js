exports.delay = interval => new Promise(resolve => setTimeout(resolve, interval));

exports.retryify = func => {
  return (...args) => {
    return (function retriedFunc(params = {args, attempt: 1}) {
      return Promise
        .resolve()
        .then(() => func(params))
        .catch(error => retriedFunc({...params, error, attempt: params.attempt + 1}));
    })();
  };
};