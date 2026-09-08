const API_URL =
import.meta.env.VITE_API_URL ||
"http://localhost:5000/api";

function getAuthToken() {
return localStorage.getItem("animeBattleToken");
}

async function request(url, options = {}) {
const token = getAuthToken();

if (!token) {
throw new Error("Authentication token is required.");
}

const response = await fetch(`${API_URL}${url}`, {
...options,
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
...(options.headers || {}),
},
});

let data = null;

try {
data = await response.json();
} catch {
data = null;
}

if (!response.ok) {
throw new Error(
data?.message ||
`Request failed with status ${response.status}`
);
}

return data;
}

export async function getRankedTeam() {
return request("/ranked-team");
}

export async function saveRankedTeam(cards) {
if (!Array.isArray(cards)) {
throw new Error("Cards must be an array.");
}

return request("/ranked-team", {
method: "POST",
body: JSON.stringify({ cards }),
});
}

export async function clearRankedTeam() {
return request("/ranked-team", {
method: "DELETE",
});
}