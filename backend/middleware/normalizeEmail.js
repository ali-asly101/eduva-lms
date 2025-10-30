// Lower-case an email field on req.body (default: 'email')
export function normalizeEmail(field = 'email') {
  return function normalize(req, _res, next) {
    if (req.body && req.body[field]) {
      req.body[field] = String(req.body[field]).toLowerCase();
    }
    next();
  };
}