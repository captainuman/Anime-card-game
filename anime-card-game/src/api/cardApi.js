const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/cards`;

const getToken = () => {
  return localStorage.getItem("animeBattleToken");
};

const requireToken = () => {
  const token = getToken();

  if (!token) {
    throw new Error("Authentication token is required.");
  }

  return token;
};

const parseResponse = async (response, fallbackMessage) => {
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
};

export const getCards = async () => {
  const response = await fetch(API_URL);

  return parseResponse(response, "Failed to fetch cards.");
};

export const getMyCollection = async () => {
  const token = requireToken();

  const response = await fetch(`${API_URL}/collection`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response, "Failed to fetch your collection.");
};

export const getCard = async (id) => {
  if (!id) {
    throw new Error("Card ID is required.");
  }

  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`);

  return parseResponse(response, "Failed to fetch card.");
};

export const createCard = async (formData) => {
  const token = requireToken();

  if (!(formData instanceof FormData)) {
    throw new Error("Card data must be provided as FormData.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response, "Failed to create card.");
};

export const createCardsBulk = async (formData) => {
  const token = requireToken();

  if (!(formData instanceof FormData)) {
    throw new Error("Bulk card data must be provided as FormData.");
  }

  const response = await fetch(`${API_URL}/bulk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response, "Failed to create cards.");
};

export const updateCard = async (id, formData) => {
  const token = requireToken();

  if (!id) {
    throw new Error("Card ID is required.");
  }

  if (!(formData instanceof FormData)) {
    throw new Error("Card data must be provided as FormData.");
  }

  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return parseResponse(response, "Failed to update card.");
};

export const deleteCard = async (id) => {
  const token = requireToken();

  if (!id) {
    throw new Error("Card ID is required.");
  }

  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response, "Failed to delete card.");
};
