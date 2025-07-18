import React from 'react'
import {useSelector} from "react-redux";
import { Link, useNavigate } from 'react-router-dom';
import Can from '../rbac/Can';
import axios from 'axios';
import { serverEndpoint } from '../config';

function UserHeader() {
    const userDetails = useSelector((state)=>state.userDetails);
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const handleResetPassword = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await axios.post(`${serverEndpoint}/auth/sendResetPasswordToken`, { email: userDetails.email });
            setSuccess('Reset code sent to your email.');
            setTimeout(() => {
                navigate('/reset-password', { state: { email: userDetails.email } });
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code.');
        } finally {
            setLoading(false);
        }
    };
  return (
    <nav className='navbar navbar-expand-lg bg-dark border-bottom border-body' data-bs-theme="dark">
        <div className='container'>
            <Link className='navbar-brand' to="/">
                Dashboard
            </Link>
            <button 
                className='navbar-toggler'
                type='button'
                data-bs-toggle='collapse'
                data-bs-target='#navbarSupportedContent'
                aria-controls='navbarSupportedContent'
                aria-expanded='false'
                aria-label='Toggle navigation'
            >
            <span className='navbar-toggler-icon'/>
            </button>
            <div className='collapse navbar-collapse' id="navbarSupportedContent">
                <ul className='navbar-nav me-auto mb-2 mb-lg-0'>
                    {/* Add other nav links here if needed */}
                </ul>
                <ul className='navbar-nav ms-auto mb-2 mb-lg-0'>
                    <li className='nav-item dropdown'>
                        <Link className='nav-link dropdown-toggle'
                            href="#"
                            role='button'
                            data-bs-toggle='dropdown'
                            aria-expanded='false'
                        >
                        {userDetails?(userDetails.name):(<>Account</>)}
                        </Link>
                        <ul className='dropdown-menu dropdown-menu-end'>
                            <Can permission='canViewUser'>
                                <li>
                                    <Link className='dropdown-item' to='/users'>
                                        Manage Users
                                    </Link>
                                </li>
                                <li>
                                    <Link className='dropdown-item' to='/manage-payments'>
                                        Payments
                                    </Link>
                                </li>
                            </Can>
                                <li>
                                    <button className='dropdown-item' onClick={handleResetPassword} disabled={loading}>
                                        {loading ? 'Sending...' : 'Reset Password'}
                                    </button>
                                </li>
                                {error && <li><div className='dropdown-item text-danger'>{error}</div></li>}
                                {success && <li><div className='dropdown-item text-success'>{success}</div></li>}
                                <hr className='m-0'/>
                            <li>
                                <Link className='dropdown-item' to="/logout">
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
  )
}

export default UserHeader