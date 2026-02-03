/**
 * React component inference examples
 *
 * PTL recognizes React patterns and infers component prop types.
 */

import { useState, useEffect, useCallback, useMemo, useContext, createContext } from 'react';

// Basic functional component
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}

// Component with multiple props
function UserCard({ user, onEdit, onDelete }) {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user)}>Edit</button>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
}

// Component with children
function Card({ title, children, className }) {
  return (
    <div className={`card ${className || ''}`}>
      {title && <h3>{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  );
}

// Component with hooks
function Counter({ initialCount = 0, step = 1 }) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => {
    setCount((c) => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount((c) => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);

  return (
    <div className="counter">
      <span>{count}</span>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// Component with effects
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Context usage
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function ThemedButton({ onClick, children }) {
  const { theme } = useContext(ThemeContext);

  return (
    <button className={`btn btn-${theme}`} onClick={onClick}>
      {children}
    </button>
  );
}

// Event handlers
function Form({ onSubmit }) {
  const [values, setValues] = useState({ name: '', email: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={values.name} onChange={handleChange} placeholder="Name" />
      <input
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export {
  Greeting,
  UserCard,
  Card,
  Counter,
  UserProfile,
  ThemeContext,
  ThemeProvider,
  ThemedButton,
  Form,
};
