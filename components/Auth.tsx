
import React, { useState } from 'react';
import { authService } from '../services/auth';

interface AuthProps {
  onLoginSuccess: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords don't match!");
        setLoading(false);
        return;
      }
      const res = await authService.signUp(username, password);
      if (!res.success) {
        setError(res.message);
        setLoading(false);
        return;
      }
      // Auto login after signup
    }

    const res = await authService.logIn(username, password);
    if (res.success) {
      onLoginSuccess(username);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-pink-400 rounded-full floating flex items-center justify-center shadow-lg mx-auto mb-4 border-4 border-white">
          <span className="text-5xl">🐷</span>
        </div>
        <h1 className="text-4xl font-black text-pink-500">{isSignUp ? 'Join Piggy!' : 'Welcome Back!'}</h1>
        <p className="text-stone-500 font-medium">Your personal path to money mastery.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <label className="text-pink-600 font-bold ml-2 text-sm uppercase tracking-wider">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl border-2 border-pink-100 focus:border-pink-500 outline-none transition-all font-medium text-stone-700"
            placeholder="CoolPiggy123"
          />
        </div>

        <div className="space-y-2">
          <label className="text-pink-600 font-bold ml-2 text-sm uppercase tracking-wider">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl border-2 border-pink-100 focus:border-pink-500 outline-none transition-all font-medium text-stone-700"
            placeholder="••••••••"
          />
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <label className="text-pink-600 font-bold ml-2 text-sm uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-pink-100 focus:border-pink-500 outline-none transition-all font-medium text-stone-700"
              placeholder="••••••••"
            />
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-pink-500 text-white text-xl font-black rounded-full shadow-lg hover:bg-pink-600 transition-all active:scale-95 disabled:bg-stone-300"
        >
          {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-pink-400 font-bold hover:text-pink-600 transition-colors underline"
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
