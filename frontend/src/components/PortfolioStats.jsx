import { useEffect, useState } from 'react';
import axios from 'axios';

const PortfolioStats = ({ userId }) => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState(null);
  const [matrix, setMatrix] = useState(null);

  const fetchPortfolios = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/portfolio/view', {
        headers: { 'x-user-id': userId }
      });
      setPortfolios(res.data.portfolios);
    } catch (err) {
      console.error('Failed to load portfolios');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/portfolio/stats', {
        params: { portfolioId: selectedId }
      });
      setStats(res.data.stats);
      setMatrix(res.data.correlationMatrix);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    if (userId) fetchPortfolios();
  }, [userId]);

  return (
    <div>
      <h3>Portfolio Stats</h3>
      <label>
        Select Portfolio:
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">-- Choose --</option>
          {portfolios.map(p => (
            <option key={p.portfolioId} value={p.portfolioId}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={fetchStats} disabled={!selectedId}>Get Stats</button>
      </label>

      {stats && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Stock Stats</h4>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Avg</th>
                <th>StdDev</th>
                <th>COV</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([symbol, s]) => (
                <tr key={symbol}>
                  <td>{symbol}</td>
                  <td>{s.average}</td>
                  <td>{s.stddev}</td>
                  <td>{s.cov}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: '1rem' }}>Correlation Matrix</h4>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th></th>
                {Object.keys(matrix).map(sym => <th key={sym}>{sym}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(matrix).map(([rowSym, row]) => (
                <tr key={rowSym}>
                  <td>{rowSym}</td>
                  {Object.keys(matrix).map(colSym => (
                    <td key={colSym}>{row[colSym]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PortfolioStats;