const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (req, res, next) => {

  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeHtml(req.body[key]);
        }
      }
    }
  }
  next();
};
module.exports = sanitizeInput;