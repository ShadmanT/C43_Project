import { Link } from 'react-router-dom';

const NavBar = () => (
  <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
    <Link to="/portfolio">Portfolio</Link> |{" "}
    <Link to="/manage">Manage Funds</Link> |{" "}
    <Link to="/stats">Portfolio Stats</Link> |{" "}
    <Link to="/data">Stock Analysis</Link> |{" "}
    <Link to="/add-stock">Add Stock</Link> |{" "}
    <Link to="/stocklists">Stock Lists</Link> |{" "}
    <Link to="/friends">Friends</Link>
  </nav>
);

export default NavBar;
