import PortfolioStats from '../components/PortfolioStats';

const StatsPage = ({ userId }) => (
  <div>
    <h2>Portfolio Statistics</h2>
    <PortfolioStats userId={userId} />
  </div>
);

export default StatsPage;