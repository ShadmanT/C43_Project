import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const HistoryViewer = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1month');
  const [data, setData] = useState([]);
  const [allSymbols, setAllSymbols] = useState([]);

  const fetchSymbols = async () => {
    try {
      const res = await axios.get('http://localhost:3000/symbols');
      const symbols = res.data.map(row => row.symbol);
      setAllSymbols(symbols);
    } catch (err) {
      console.error('Failed to fetch symbols');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/portfolio/history`, {
        params: { symbol, interval }
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  return (
    <div>
      <h3>Historical Price Viewer</h3>
      <label>
        Symbol:
        <select value={symbol} onChange={e => setSymbol(e.target.value)}>
          {allSymbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>
        Interval:
        <select value={interval} onChange={e => setInterval(e.target.value)}>
          <option value="1week">1 Week</option>
          <option value="1month">1 Month</option>
          <option value="3months">3 Months</option>
          <option value="1year">1 Year</option>
          <option value="5years">5 Years</option>
        </select>
      </label>
      <button onClick={fetchHistory}>View History</button>

      {data.length > 0 && (
        <>
          <div style={{ marginTop: '1rem' }}>
            <h4>Price Chart</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4>Close Price Table</h4>
            <table border="1" cellPadding="5">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Close Price</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td>${parseFloat(row.close).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryViewer;