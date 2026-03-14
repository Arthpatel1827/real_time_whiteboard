import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setAuth } from '../auth/authStorage';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const hostname = window.location.hostname;
    const apiBaseUrl = `http://${hostname}:5000`;

    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            setAuth(result.token, result.user);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Login</h1>
                <p>Sign in to use the whiteboard.</p>
            </header>

            <main style={{ maxWidth: 420, margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, marginTop: 6 }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, marginTop: 6 }}
                        />
                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{ marginTop: 16 }}>
                    Don&apos;t have an account? <Link to="/register">Register</Link>
                </p>
            </main>
        </div>
    );
}