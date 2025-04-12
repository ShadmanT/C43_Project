import { useState } from 'react';
import axios from 'axios';

const RegisterForm = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("All fields are required.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/auth/signup', {
        username,
        email,
        password
      });
      onRegister(res.data.userId);
      alert('Registration successful!');
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg === 'Username already exists') {
        alert("This username is already taken.");
      } else if (msg === 'Email already registered') {
        alert("An account with this email already exists.");
      } else {
        alert(`Signup failed: ${msg || 'Server error.'}`);
      }
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      /><br />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default RegisterForm;