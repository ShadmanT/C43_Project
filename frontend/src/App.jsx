import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PortfolioView from './components/PortfolioView';
import PortfolioStats from './components/PortfolioStats';
import TradeForm from './components/TradeForm';
import PredictionGraph from './components/PredictionGraph';
import HistoryViewer from './components/HistoryViewer';
import StockListPanel from './components/StockListPanel';
import ShareListsWithFriends from './components/ShareListsWithFriends';

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {!userId ? (
        <>
          <LoginForm setUserId={setUserId} />
          <hr />
          <RegisterForm onRegister={setUserId} />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">Logged in as user {userId}</p>

          <StockListPanel
            userId={userId}
            ownedLists={ownedLists}
            sharedLists={sharedLists}
          />

          <ShareListsWithFriends
            userId={userId}
            ownedLists={ownedLists}
          />

          <TradeForm
            userId={userId}
            portfolios={portfolios}
            refreshPortfolios={refreshPortfolios}
          />
          <hr />
          <PortfolioView portfolios={portfolios} />
          <hr />
          <PortfolioStats userId={userId} />
          <hr />
          <HistoryViewer />
          <hr />
          <PredictionGraph userId={userId} portfolios={portfolios} />
        </>
      )}
    </div>
  );
}

export default App;
