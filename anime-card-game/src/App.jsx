import { BrowserRouter, Routes, Route } from "react-router-dom";

import Game from "./Game";
import Navbar from "./components/Navbar";

import MyCardCollection from "./components/Collection/MyCardCollection";

import AddCard from "./components/admin/AddCard";
import BulkAddCards from "./components/admin/BulkAddCards";
import AdminCards from "./components/admin/AdminCards";
import EditCard from "./components/admin/EditCard";
import Manage from "./components/admin/Manage";

import Login from "./pages/Login";
import Register from "./pages/Register";

import TournamentPage from "./pages/TournamentPage";

import ProfilePage from "./components/Profile/ProfilePage";

import RankedTeam from "./components/Profile/RankedTeam";

import RankedMatchStart from "./components/ranked/RankedMatchStart";
import RankedMatch from "./components/ranked/RankedMatch";
import RankedResult from "./components/ranked/RankedResult";

import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/AdminRoute";
import AllCardsCollection from "./components/Collection/AllCardsCollection";
import CardDrawPage from "./components/Collection/CardDrawPage";

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="pt-20 text-center">
        <h1 className="text-5xl font-black">🎴 ANIME CARD BATTLE</h1>

        <p className="text-gray-400 mt-4">
          Choose Game or Collection from the navbar
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Game />} />

        <Route path="/game/*" element={<Game />} />

        <Route path="/collection" element={<MyCardCollection />} />

        <Route
          path="/admin/manage"
          element={
            <AdminRoute>
              <Manage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/add-card"
          element={
            <AdminRoute>
              <AddCard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/bulk-add"
          element={
            <AdminRoute>
              <BulkAddCards />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/cards"
          element={
            <AdminRoute>
              <AllCardsCollection />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/edit-card/:id"
          element={
            <AdminRoute>
              <EditCard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/cards/edit"
          element={
            <AdminRoute>
              <AdminCards />
            </AdminRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/tournament" element={<TournamentPage />} />

        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/ranked-team" element={<RankedTeam />} />

        <Route path="/ranked-match/start" element={<RankedMatchStart />} />

        <Route path="/ranked-match/battle" element={<RankedMatch />} />

        <Route path="/ranked-match/result" element={<RankedResult />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/draw" element={<CardDrawPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
