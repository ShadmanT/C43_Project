import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NavBar from './components/NavBar';
import PortfolioPage from './pages/PortfolioPage';
import TradingPage from './pages/ManageFundsPage';
import StatsPage from './pages/StatsPage';
import StockAnalysis from './pages/StockAnalysis';
import AddStockPage from './pages/AddStockPage';
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
    <Router>
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
            </Routes>
          </>
        )}
      </div>
    </Router>
  );
}

export default App;