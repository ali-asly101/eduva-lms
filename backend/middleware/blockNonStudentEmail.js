import { isEmailInstructorOrAdmin } from '../models/studentModel.js';

export async function blockNonStudentEmail(req, res, next) {
  try {
    const email = req.body?.email;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    if (await isEmailInstructorOrAdmin(email)) {
      return res.status(403).json({
        error: 'This email belongs to a non-student role. Contact admin.'
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}