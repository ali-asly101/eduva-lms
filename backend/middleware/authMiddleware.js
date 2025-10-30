// route guards that attach to Express routes to block requests
// unless the user is allowed.

// These middleware run before your route handler and
// decide whether to continue (next()) or block.

// let the request through only if the user is logged in
// checks req.isAuthenticated() and that req.user exists (both come from Passport sessions)
// otherwise responds 401 unauthorized
export function requireAuth(req, res, next) {
    if (req.isAuthenticated?.() && req.user) return next();
    return res.status(401).json({error: 'Not authenticated'});
}

// lets the request through only if the logged-in user's role is student
// if not logged in but wrong role -> 403 (forbidden)
export function requireStudent(req, res, next) {
    if (req.isAuthenticated?.() && req.user?.role === 'student') return next();
    return res.status(403).json({error: 'Students only'});
}
export function requireInstructor(req, res, next) {
  console.log('Auth check:');
  console.log('- isAuthenticated:', req.isAuthenticated?.());
  console.log('- req.user:', req.user);
  console.log('- user role:', req.user?.role);
  
  if (req.isAuthenticated?.() && (req.user?.role === "instructor" || req.user?.role === "admin")) {
    return next();
  }
  return res.status(403).json({ error: "Instructors only" });
}
