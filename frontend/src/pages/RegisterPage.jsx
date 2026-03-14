import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setAuth } from '../auth/authStorage';

export default function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        displayName: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const hostname = window.location.hostname;
    const apiBaseUrl = `http://${hostname}:5000`;

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
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            setAuth(result.token, result.user);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>Register</h1>
                <p>Create your whiteboard account.</p>
            </header>

            <main style={{ maxWidth: 420, margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label>Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={form.displayName}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 10, marginTop: 6 }}
                        />
                    </div>

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
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p style={{ marginTop: 16 }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </main>
        </div>
    );
}