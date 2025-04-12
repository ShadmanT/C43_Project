import { useEffect, useState } from 'react';
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

const PredictionGraph = () => {
  const [allSymbols, setAllSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [days, setDays] = useState(30); // default interval
  const [data, setData] = useState([]);

  const fetchSymbols = async () => {
    try {
      const res = await axios.get('http://localhost:3000/symbols');
      const symbols = res.data.map(row => row.symbol);
      setAllSymbols(symbols);
      if (symbols.length > 0) {
        setSelectedSymbol(symbols[0]);
      }
    } catch (err) {
      console.error('Failed to fetch symbols');
    }
  };

  const fetchPrediction = async () => {
    if (!selectedSymbol) return;
    try {
      const res = await axios.get(`http://localhost:3000/api/portfolio/predict`, {
        params: { symbol: selectedSymbol, days }
      });
      setData(res.data.predicted || []);
    } catch (err) {
      console.error('Prediction fetch failed', err);
    }
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  useEffect(() => {
    fetchPrediction();
  }, [selectedSymbol, days]);

  return (
    <div>
      <h3>Future Price Prediction</h3>
      <label>
        Symbol:
        <select value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}>
          {allSymbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label style={{ marginLeft: '1rem' }}>
        Predict for:
        <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
          <option value={7}>1 Week</option>
          <option value={30}>1 Month</option>
          <option value={365}>1 Year</option>
        </select>
      </label>

      {data.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PredictionGraph;