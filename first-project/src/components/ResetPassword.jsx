import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { serverEndpoint } from '../config';

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  const [form, setForm] = useState({
    email: emailFromState,
    code: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${serverEndpoint}/auth/resetPassword`,
        {
          email: form.email,
          code: form.code,
          newPassword: form.newPassword,
        }
      );
      setSuccess(res.data.message || 'Password reset successful.');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to reset password. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '450px' }}>
        <h3 className="text-center mb-4">Reset Password</h3>
        {error && <div className="alert alert-danger text-center">{error}</div>}
        {success && <div className="alert alert-success text-center">{success}</div>}
        <form onSubmit={handleSubmit}>
          {!emailFromState && (
            <div className="mb-3 text-start">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="mb-3 text-start">
            <label htmlFor="code" className="form-label">Reset Code</label>
            <input
              type="text"
              className="form-control"
              id="code"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              maxLength={6}
            />
          </div>
          <div className="mb-3 text-start">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="d-grid mb-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword; 