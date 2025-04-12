import { useState } from 'react';
import LoginForm from './components/LoginForm';

function App() {
  const [userId, setUserId] = useState(null);

  return (
    <div>
      {!userId ? (
        <LoginForm setUserId={setUserId} />
      ) : (
        <p>Logged in as user {userId}</p>
      )}
    </div>
  );
}

export default App;