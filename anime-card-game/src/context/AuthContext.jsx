import { createContext, useContext, useEffect, useState } from "react";
import {
registerUser,
loginUser,
adminLoginUser,
getCurrentUser,
} from "../api/authApi";
import socket from "../socket";

const AuthContext = createContext(null);

function normalizeUser(data) {
if (!data) {
return null;
}

const user = data.user || data.currentUser || data;

if (!user) {
return null;
}

const id = user.id || user._id || user.userId || null;

if (!id) {
return null;
}

return {
...user,
id: String(id),
role: user.role || "user",
};
}

function saveUserIdentity(user) {
if (!user?.id) {
return;
}

localStorage.setItem("userId", String(user.id));

if (user.username) {
localStorage.setItem("username", user.username);
} else if (user.name) {
localStorage.setItem("username", user.name);
}
}

function clearUserIdentity() {
localStorage.removeItem("userId");
localStorage.removeItem("user_id");
localStorage.removeItem("username");
localStorage.removeItem("name");
}

export function AuthProvider({ children }) {
const [user, setUser] = useState(null);

const [token, setToken] = useState(() =>
localStorage.getItem("animeBattleToken"),
);

const [loading, setLoading] = useState(true);

useEffect(() => {
if (!user || !token) {
return;
}

saveUserIdentity(user);

socket.auth = {
  token,
};

if (!socket.connected) {
  socket.connect();
}

return () => {
  socket.disconnect();
};
}, [user, token]);

useEffect(() => {
let cancelled = false;

const restoreUser = async () => {
  if (!token) {
    socket.disconnect();
    clearUserIdentity();

    if (!cancelled) {
      setUser(null);
      setLoading(false);
    }

    return;
  }

  try {
    setLoading(true);

    const data = await getCurrentUser(token);
    const restoredUser = normalizeUser(data);

    if (!restoredUser) {
      throw new Error("Unable to determine logged-in user.");
    }

    saveUserIdentity(restoredUser);

    if (!cancelled) {
      setUser(restoredUser);
    }
  } catch (error) {
    console.error("Failed to restore login:", error);

    localStorage.removeItem("animeBattleToken");
    clearUserIdentity();
    socket.disconnect();

    if (!cancelled) {
      setToken(null);
      setUser(null);
    }
  } finally {
    if (!cancelled) {
      setLoading(false);
    }
  }
};

restoreUser();

return () => {
  cancelled = true;
};

}, [token]);

const register = async (userData) => {
const data = await registerUser(userData);


const normalizedUser = normalizeUser(data);

if (!normalizedUser) {
  throw new Error("Registration succeeded but user data is missing.");
}

if (!data.token) {
  throw new Error("Registration succeeded but authentication token is missing.");
}

localStorage.setItem("animeBattleToken", data.token);
saveUserIdentity(normalizedUser);

setToken(data.token);
setUser(normalizedUser);

return {
  ...data,
  user: normalizedUser,
};

};

const login = async (credentials) => {
const data = await loginUser(credentials);

const normalizedUser = normalizeUser(data);

if (!normalizedUser) {
  throw new Error("Login succeeded but user data is missing.");
}

if (!data.token) {
  throw new Error("Login succeeded but authentication token is missing.");
}

localStorage.setItem("animeBattleToken", data.token);
saveUserIdentity(normalizedUser);

setToken(data.token);
setUser(normalizedUser);

return {
  ...data,
  user: normalizedUser,
};

};

const adminLogin = async (credentials) => {
const data = await adminLoginUser(credentials);

const normalizedUser = normalizeUser(data);

if (!normalizedUser) {
  throw new Error("Admin login succeeded but user data is missing.");
}

if (normalizedUser.role !== "admin") {
  throw new Error("Admin access denied.");
}

if (!data.token) {
  throw new Error("Admin login succeeded but authentication token is missing.");
}

localStorage.setItem("animeBattleToken", data.token);
saveUserIdentity(normalizedUser);

setToken(data.token);
setUser(normalizedUser);

return {
  ...data,
  user: normalizedUser,
};

};

const logout = () => {
socket.disconnect();

localStorage.removeItem("animeBattleToken");
clearUserIdentity();

setToken(null);
setUser(null);


};
const value = {
user,
token,
loading,
isAuthenticated: Boolean(user && token),
isAdmin: Boolean(user?.role === "admin"),
register,
login,
adminLogin,
logout,
};

return (
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);

if (!context) {
throw new Error("useAuth must be used inside AuthProvider");
}

return context;
}
