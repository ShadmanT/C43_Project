import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PortfolioView from './components/PortfolioView';
import PortfolioStats from './components/PortfolioStats';
import TradeForm from './components/TradeForm';
import PredictionGraph from './components/PredictionGraph';
import HistoryViewer from './components/HistoryViewer';
import axios from 'axios';

function App() {
  const [userId, setUserId] = useState(null);
  const [portfolios, setPortfolios] = useState([]);

  const refreshPortfolios = async () => {
    if (!userId) return;
    try {
      const res = await axios.get('http://localhost:3000/api/portfolio/view', {
        headers: { 'x-user-id': userId }
      });
      setPortfolios(res.data.portfolios);
    } catch (err) {
      console.error('Failed to refresh portfolios', err);
    }
  };

  useEffect(() => {
    if (userId) {
      refreshPortfolios();
    }
  }, [userId]);

  return (
    <div>
      {!userId ? (
        <>
        <LoginForm setUserId={setUserId} />
        <hr />
        <RegisterForm onRegister={(id) => setUserId(id)} />
        </>
      ) : (
        <>
          <p>Logged in as user {userId}</p>
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
          <HistoryViewer/>
          <hr />
          <PredictionGraph userId={userId} portfolios={portfolios} />

        </>
      )}
    </div>
  );
}

export default App;