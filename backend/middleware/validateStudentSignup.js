// Ensure required fields exist for student sign-up
export function validateStudentSignup(req, res, next) {
  const { role, email, password, first_name, last_name } = req.body || {};
  if (role !== 'student') {
    return res.status(403).json({ error: 'Only students can sign up.' });
  }
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({
      error: 'Missing required fields: first_name, last_name, email, password.'
    });
  }
  next();
}