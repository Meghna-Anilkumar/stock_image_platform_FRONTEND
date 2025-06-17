import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { signUpUser } from '@/redux/actions/authActions';
import { clearError } from '@/redux/reducers/userReducer';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Validation schema using Yup
const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .required('Phone number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .matches(/[!@#$%^&*]/, 'Must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Initial form values
const initialValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const Signup: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Redux state access
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState?.user || null;
  const reduxError = authState?.error || null;
  const loading = authState?.loading || false;

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Handle redirect and toasts
  useEffect(() => {
    if (user) {
      toast.success('Signup successful! Redirecting to login...', {
        position: 'top-right',
        autoClose: 2000,
      });
      // Clear user state and redirect to login
      setTimeout(() => {
        dispatch(clearError());
        navigate('/login');
      }, 2000);
    }
    if (reduxError) {
      toast.error(reduxError, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, [user, reduxError, navigate, dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (reduxError) {
        dispatch(clearError());
      }
    };
  }, [dispatch, reduxError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-300 via-violet-300 to-blue-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-violet-600 mb-4">Create Account</h2>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setStatus, resetForm }) => {
            try {
              // Clear any previous errors
              dispatch(clearError());
              setStatus({});
              
              await dispatch(signUpUser(values)).unwrap();
              setStatus({ success: 'Signup successful! Redirecting...' });
              resetForm();
            } catch (err) {
              const errorMessage = err?.error?.message || err?.message || 'Signup failed. Please try again.';
              setStatus({ error: errorMessage });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, isValid, dirty, status, setStatus }) => (
            <Form
              className="space-y-4"
              onChange={() => {
                if (status?.error) setStatus({}); // Clear error on input change
                if (reduxError) dispatch(clearError()); // Clear Redux error
              }}
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Field
                  id="phone"
                  name="phone"
                  type="tel"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                <ErrorMessage
                  name="phone"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              {(status?.error || reduxError) && (
                <div className="text-red-500 text-sm text-center">
                  {status?.error || reduxError}
                </div>
              )}
              {status?.success && (
                <div className="text-green-500 text-sm text-center">{status.success}</div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !isValid || !dirty || loading}
                className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
                  isValid && dirty && !loading
                    ? 'bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting || loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </Form>
          )}
        </Formik>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            Log in
          </a>
        </p>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </div>
    </div>
  );
};

export default Signup;