const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/profile`;

function getToken() {
  return localStorage.getItem("animeBattleToken");
}

async function profileRequest(endpoint = "", options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    ...(options.body !== undefined
      ? { body: options.body }
      : {}),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Profile request failed.");
  }

  return data;
}

export async function getProfile() {
  return profileRequest();
}

export async function getCardCollection() {
  return profileRequest("/cards");
}

export async function drawCard() {
  return profileRequest("/draw", {
    method: "POST",
  });
}