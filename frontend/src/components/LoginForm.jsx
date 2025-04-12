import { useState } from 'react';
import axios from 'axios';

const LoginForm = ({ setUserId }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        emailOrUsername,
        password,
      });
      setUserId(res.data.userId);
      alert('Login successful!');
    } catch (err) {
      // Always show generic message for login errors
      alert("Login failed: Username or password is incorrect.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Email or Username"
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        required
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginForm;