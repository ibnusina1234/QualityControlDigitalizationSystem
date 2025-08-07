module.exports = function parsePermissions(req, res, next) {
  if (req.body.permissions && typeof req.body.permissions === "string") {
    try {
      req.body.permissions = JSON.parse(req.body.permissions);
    } catch (e) {
      req.body.permissions = [];
    }
  }
  next();
};