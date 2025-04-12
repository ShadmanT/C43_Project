import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NavBar from './components/NavBar';

import PortfolioView from './components/PortfolioView';
import PortfolioStats from './components/PortfolioStats';
import TradeForm from './components/TradeForm';
import PredictionGraph from './components/PredictionGraph';
import HistoryViewer from './components/HistoryViewer';
import StockListPanel from './components/StockListPanel';
import ShareListsWithFriends from './components/ShareListsWithFriends';

import PortfolioPage from './pages/PortfolioPage';
import TradingPage from './pages/ManageFundsPage';
import StatsPage from './pages/StatsPage';
import StockAnalysis from './pages/StockAnalysis';
import AddStockPage from './pages/AddStockPage';

import axios from 'axios';

function App() {
  const [userId, setUserId] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [ownedLists, setOwnedLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);

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

  const fetchStockLists = async () => {
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
      console.error('Failed to fetch stock lists', err);
    }
  };

  useEffect(() => {
    if (userId) {
      refreshPortfolios();
      fetchStockLists();
    }
  }, [userId]);

  return (
    <Router>
      <div>
        {!userId ? (
          <>
            <LoginForm setUserId={setUserId} />
            <hr />
            <RegisterForm onRegister={setUserId} />
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">Logged in as user {userId}</p>
            <button onClick={() => setUserId(null)}>Log Out</button>
            <NavBar />
            <Routes>
              <Route
                path="/portfolio"
                element={<PortfolioPage userId={userId} portfolios={portfolios} refreshPortfolios={refreshPortfolios} />}
              />
              <Route
                path="/manage"
                element={<TradingPage userId={userId} portfolios={portfolios} refreshPortfolios={refreshPortfolios} />}
              />
              <Route
                path="/stats"
                element={<StatsPage userId={userId} />}
              />
              <Route
                path="/data"
                element={<StockAnalysis userId={userId} portfolios={portfolios} />}
              />
              <Route
                path="/add-stock"
                element={<AddStockPage userId={userId} />}
              />
              <Route
                path="/stocklists"
                element={
                  <>
                    <StockListPanel userId={userId} ownedLists={ownedLists} sharedLists={sharedLists} />
                    <ShareListsWithFriends userId={userId} ownedLists={ownedLists} />
                  </>
                }
              />
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;
