import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NavBar from './components/NavBar';

import StockListPanel from './components/StockListPanel';
import ShareListsWithFriends from './components/ShareListsWithFriends';
import FriendsPanel from './components/FriendsPanel';

import PortfolioPage from './pages/PortfolioPage';
import TradingPage from './pages/ManageFundsPage';
import StatsPage from './pages/StatsPage';
import StockAnalysis from './pages/StockAnalysis';
import AddStockPage from './pages/AddStockPage';

import axios from 'axios';

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const [userId, setUserId] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [ownedLists, setOwnedLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);

  const navigate = useNavigate();

  const refreshPortfolios = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/portfolio/view', {
        headers: { 'x-user-id': userId }
      });
      setPortfolios(res.data.portfolios);
    } catch (err) {
      console.error('Failed to refresh portfolios', err);
    }
  };

  const refreshLists = async () => {
    try {
      const [ownedRes, sharedRes] = await Promise.all([
        axios.get('http://localhost:3000/api/stocklists', {
          headers: { 'x-user-id': userId }
        }),
        axios.get('http://localhost:3000/api/stocklists/shared', {
          headers: { 'x-user-id': userId }
        })
      ]);

      setOwnedLists(ownedRes.data);
      setSharedLists(sharedRes.data);
    } catch (err) {
      console.error('Failed to refresh stock lists', err);
    }
  };

  useEffect(() => {
    if (userId) {
      refreshPortfolios();
      refreshLists();
      navigate('/');
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <LoginForm setUserId={setUserId} />
        <hr />
        <RegisterForm onRegister={setUserId} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <p className="text-sm text-gray-500 mb-2">Logged in as user {userId}</p>
      <button onClick={() => setUserId(null)}>Log Out</button>
      <NavBar />

      <Routes>
        <Route
          path="/"
          element={
            <StockListPanel
              userId={userId}
              ownedLists={ownedLists}
              sharedLists={sharedLists}
              refreshLists={refreshLists}
            />
          }
        />
        <Route
          path="/stocklists"
          element={
            <>
              <StockListPanel
                userId={userId}
                ownedLists={ownedLists}
                sharedLists={sharedLists}
                refreshLists={refreshLists}
              />
            </>
          }
        />
        <Route path="/friends" element={<FriendsPanel userId={userId} />} />
        <Route
          path="/portfolio"
          element={
            <PortfolioPage
              userId={userId}
              portfolios={portfolios}
              refreshPortfolios={refreshPortfolios}
            />
          }
        />
        <Route
          path="/manage"
          element={
            <TradingPage
              userId={userId}
              portfolios={portfolios}
              refreshPortfolios={refreshPortfolios}
            />
          }
        />
        <Route path="/stats" element={<StatsPage userId={userId} />} />
        <Route
          path="/data"
          element={<StockAnalysis userId={userId} portfolios={portfolios} />}
        />
        <Route path="/add-stock" element={<AddStockPage userId={userId} />} />
      </Routes>
    </div>
  );
}

export default AppWrapper;
