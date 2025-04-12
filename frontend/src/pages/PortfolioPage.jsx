import AddPortfolio from '../components/AddPortfolio';
import PortfolioView from '../components/PortfolioView';

const PortfolioPage = ({ userId, portfolios, refreshPortfolios }) => (
  <div>
    <h2>Manage Portfolios</h2>
    <AddPortfolio userId={userId} onCreate={refreshPortfolios} />
    <PortfolioView portfolios={portfolios} />
  </div>
);

export default PortfolioPage;