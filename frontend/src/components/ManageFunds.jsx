import { useEffect, useState } from 'react';
import axios from 'axios';

const ManageFundsForm = ({ userId, portfolios, refreshPortfolios }) => {
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
        if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
          alert("Amount must be a positive number.");
          return;
        }

        await axios.post(`http://localhost:3000/api/portfolio/${action}`, {
          portfolioId,
          amount: parseFloat(amount)
        });
      } else if (action === 'buy' || action === 'sell') {
        if (!symbol.trim()) {
          alert("Stock symbol cannot be empty.");
          return;
        }

        const sharesNum = parseInt(shares);
        if (sharesNum <= 0 || isNaN(sharesNum) || !Number.isInteger(sharesNum)) {
          alert("Number of shares must be a positive whole number.");
          return;
        }

        await axios.post(`http://localhost:3000/api/portfolio/${action === 'buy' ? 'add-stock' : 'sell-stock'}`, {
          portfolioId,
          symbol: symbol.toUpperCase(),
          numShares: sharesNum
        });
      }

      alert(`${action} successful`);
      refreshPortfolios();

      // clear form inputs
      setAmount('');
      setSymbol('');
      setShares('');
    } catch (err) {
      const msg = err?.response?.data?.error || `${action} failed due to server error.`;
      alert(msg);
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

export default ManageFundsForm;