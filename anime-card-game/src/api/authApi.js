const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/auth`;

async function parseResponse(response, fallbackMessage) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export async function registerUser({ username, email, password }) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  return parseResponse(response, "Registration failed.");
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return parseResponse(response, "Login failed.");
}

export async function adminLoginUser({ email, password }) {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return parseResponse(response, "Admin login failed.");
}

export async function getCurrentUser(token) {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response, "Failed to get current user.");
}