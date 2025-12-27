import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async () => {
    setMessage('');
    if (!username || !password) {
      setMessage('Please enter both username and password.');
      return;
    }

    try {
      if (isLogin) {
        // Check if user exists
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (error || !data) {
          setMessage('Invalid username or password.');
        } else {
          setMessage(`Welcome, ${data.username}!`);
          localStorage.setItem('username', data.username); // Store username
          localStorage.setItem('userId', data.id); // Store user ID for later use
          navigate('/select-ttrpg'); // Navigate to new page
        }
      } else {
        // Check if username already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('user')
          .select('username')
          .eq('username', username)
          .single();

        if (existingUser) {
          setMessage('Username already exists. Please choose a different username.');
          return;
        }

        // Create a new account with admin: false
        const { error } = await supabase
          .from('user')
          .insert([{ 
            username, 
            password,
            admin: false  // Explicitly set admin to false for new users
          }]);

        if (error) {
          setMessage(`Signup failed: ${error.message}`);
        } else {
          setMessage('Account created! You can now log in.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage('Something went wrong.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* ---------- LOGO (centered at the very top) ---------- */}
      <div className="mb-6">
        <img
          src="/TTRPGLogo.png"
          alt="TTRPG Logo"
          className="max-w-xs w-full h-auto mx-auto"
        />
      </div>

      {/* ---------- VERSION IMAGE (left-aligned, under logo) ---------- */}
      <div className="self-start ml-8 mb-4">
        <img
          src="/Version.png"
          alt="Version"
          className="h-8 w-auto"
        />
      </div>

      {/* ---------- LOGIN / SIGN-UP CARD ---------- */}
      <div className="bg-white p-8 rounded-2xl shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="border p-2 mb-3 w-full rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 mb-4 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded w-full mb-2"
        >
          {isLogin ? 'Login' : 'Create Account'}
        </button>

        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            className="text-blue-500 underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}