import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const PredictionGraph = ({ userId, portfolios }) => {
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    // Extract unique symbols from all portfolios
    const userSymbols = [];
    portfolios.forEach(p => {
      p.holdings.forEach(h => {
        if (!userSymbols.includes(h.symbol)) {
          userSymbols.push(h.symbol);
        }
      });
    });
    setSymbols(userSymbols);
    if (userSymbols.length > 0) {
      setSelectedSymbol(userSymbols[0]);
    }
  }, [portfolios]);

  useEffect(() => {
    if (!selectedSymbol) return;
    const fetchPrediction = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/portfolio/predict`, {
          params: { symbol: selectedSymbol, days: 7 }
        });
        setData(res.data.predicted);
      } catch (err) {
        console.error('Prediction fetch failed', err);
      }
    };

    fetchPrediction();
  }, [selectedSymbol]);

  return (
    <div>
      <h2>Stock Prediction</h2>
      {symbols.length === 0 ? (
        <p>No stocks to predict yet.</p>
      ) : (
        <>
          <label>Select Stock:</label>
          <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
            {symbols.map((sym, i) => (
              <option key={i} value={sym}>
                {sym}
              </option>
            ))}
          </select>

          {data.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionGraph;