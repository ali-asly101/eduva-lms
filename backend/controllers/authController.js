import bcrypt from "bcryptjs";
// pulls in data-access helpers that talk to the students table
import {
  createStudentWithPassword,
  getStudentByEmail,
  setStudentPasswordAndMaybeTitle,
} from "../models/studentModel.js";

// this is the controller that handles the POST /api/auth/signup route
export async function signupStudent(req, res, next) {
  try {
    // earlier middleware should have validated and lower-cased email
    const { email, password, first_name, last_name, title } = req.body;
    // checks if a student row already exists with this email.
    const existing = await getStudentByEmail(email);

    // hashes the incoming password using cost factor 12
    const cost = 12;
    const password_hash = await bcrypt.hash(password, cost);

    // if a student row already exists
    if (existing) {
      // if they already have a password, this is a normal acc
      // -> return 409 telling them to log in instead.
      if (existing.password_hash) {
        return res
          .status(409)
          .json({ message: "Account already exists. Please log in." });
      }
      // if they don't have a password (e.g., they first used Google),
      // this attaches a password to the same student row, and
      // updates the title.
      const updated = await setStudentPasswordAndMaybeTitle(
        existing.id,
        password_hash,
        title || null
      );
      // builds a user payload (explicitly setting role = student)
      const user = { ...updated, role: "student" };
      // calls req.login(...) (Passport) to create a session immediately,
      // then responds with the user JSON.
      return req.login({ id: user.id, role: "student" }, (err) => {
        if (err) return next(err);
        return res.json({ user });
      });
    }
    // no existing student -> create a new student row with the hashed pwd
    const created = await createStudentWithPassword({
      email,
      title: title || "Student",
      first_name,
      last_name,
      password_hash,
    });
    // logs the user in (session) and returns the created user.
    const user = { ...created, role: "student" };
    return req.login({ id: user.id, role: "student" }, (err) => {
      if (err) return next(err);
      return res.json({ user });
    });
  } catch (e) {
    // any error goes to Express's error handler via next(e)
    next(e);
  }
}
