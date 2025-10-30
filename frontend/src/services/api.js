export const API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api`;

export const testBackendConnection = async () => {
  try {
    console.log('Attempting to connect to:', `${API_BASE_URL}/health`);
    
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend response:', data);
    return data;
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
};

// 🔹 For login
export async function signIn(email, password, role) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `login failed (${res.status})`);
  }
  return res.json(); // { user }
}

// 🔹 For signup
export async function signUp(payload) {
  // payload must have: role, email, title, first_name, last_name, password
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `sign up failed (${res.status})`);
  }
  return res.json(); // { user: {...} }
}

// 🔹 For checking lesson prerequisites
export async function checkLessonPrerequisites(lessonId, studentId) {
  const res = await fetch(`${API_BASE_URL}/lessons/${lessonId}/prerequisites/${studentId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `prerequisite check failed (${res.status})`);
  }
  return res.json(); // { accessAllowed, unmetPrerequisites, allPrerequisites, lessonTitle }
}
