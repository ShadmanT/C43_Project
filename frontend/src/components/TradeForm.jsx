import { useEffect, useState } from 'react';
import axios from 'axios';

const TradeForm = ({ userId, portfolios, refreshPortfolios }) => {
  const [portfolioId, setPortfolioId] = useState('');
  const [action, setAction] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');

  useEffect(() => {
    if (portfolios.length > 0) {
      setPortfolioId(portfolios[0].portfolioId);
    }
  }, [portfolios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (action === 'deposit' || action === 'withdraw') {
        await axios.post(`http://localhost:3000/api/portfolio/${action}`, {
          portfolioId,
          amount: parseFloat(amount)
        });
      } else if (action === 'buy' || action === 'sell') {
        await axios.post(`http://localhost:3000/api/portfolio/${action === 'buy' ? 'add-stock' : 'sell-stock'}`, {
          portfolioId,
          symbol,
          numShares: parseInt(shares)
        });
      }

      alert(`${action} successful`);
      refreshPortfolios(); // auto refresh after success

      // clear form inputs
      setAmount('');
      setSymbol('');
      setShares('');
    } catch (err) {
      console.error(`${action} failed`, err);
      alert(`${action} failed`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Manage Portfolio</h2>

      <label>Portfolio:</label>
      <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)}>
        {portfolios.map((p) => (
          <option key={p.portfolioId} value={p.portfolioId}>
            {p.name}
          </option>
        ))}
      </select><br />

      <label>Action:</label>
      <select value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
        <option value="buy">Buy Stock</option>
        <option value="sell">Sell Stock</option>
      </select><br />

      {(action === 'deposit' || action === 'withdraw') && (
        <>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          /><br />
        </>
      )}

      {(action === 'buy' || action === 'sell') && (
        <>
          <input
            type="text"
            placeholder="Stock Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
          /><br />
          <input
            type="number"
            placeholder="Number of Shares"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            required
          /><br />
        </>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};

export default TradeForm;
