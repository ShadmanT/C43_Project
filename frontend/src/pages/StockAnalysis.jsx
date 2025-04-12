import { useState } from 'react';
import AddStockData from '../components/AddStockData';
import PredictionGraph from '../components/PredictionGraph';
import HistoryViewer from '../components/HistoryViewer';

const StockAnalysis = ({ userId, portfolios }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div>
      <h2>Stock Analysis</h2>
      <PredictionGraph
        userId={userId}
        portfolios={portfolios}
        refreshTrigger={refreshTrigger}
      />
      <HistoryViewer />
    </div>
  );
};

export default StockAnalysis;