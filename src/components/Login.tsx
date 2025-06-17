import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { loginUser } from '@/redux/actions/authActions';
import { clearError } from '@/redux/reducers/userReducer';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const validationSchema = Yup.object({
  loginMethod: Yup.string().oneOf(['email', 'phone'], 'Invalid login method').required(),
  email: Yup.string().when('loginMethod', {
    is: 'email',
    then: (schema) => schema.email('Invalid email address').required('Email is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  phone: Yup.string().when('loginMethod', {
    is: 'phone',
    then: (schema) => schema.matches(/^\d{10}$/, 'Phone number must be exactly 10 digits').required('Phone number is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

// Initial form values
const initialValues = {
  loginMethod: 'email',
  email: '',
  phone: '',
  password: '',
};

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Redux state access
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState?.user || null;
  const token = authState?.token || null;
  const reduxError = authState?.error || null;
  const loading = authState?.loading || false;

  console.log(user,'kkkkkkkkkkkkkkk');
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkExistingAuth = () => {
      // If user is already logged in (from Redux state or localStorage)
      if (user && token) {
        toast.info('You are already logged in. Redirecting to dashboard...', {
          position: 'top-right',
          autoClose: 2000,
        });
        navigate('/dashboard', { replace: true });
        return;
      }

      // Check localStorage for persisted user data
      const userData = localStorage.getItem("userData");
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser.id) {
            // User data exists in localStorage, redirect to dashboard
            // The AuthProvider should handle setting this in Redux state
            toast.info('Welcome back! Redirecting to dashboard...', {
              position: 'top-right',
              autoClose: 2000,
            });
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (error) {
          // Invalid userData in localStorage, remove it
          localStorage.removeItem("userData");
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkExistingAuth();
  }, [user, token, navigate]);

  // Handle successful login redirect and toasts
  useEffect(() => {
    if (user && token && !isCheckingAuth) {
      toast.success('Login successful! Redirecting to dashboard...', {
        position: 'top-right',
        autoClose: 2000,
      });
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    }
    if (reduxError && !isCheckingAuth) {
      toast.error(reduxError, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, [user, token, reduxError, navigate, isCheckingAuth]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (reduxError) {
        dispatch(clearError());
      }
    };
  }, [dispatch, reduxError]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-600">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              // Clear any previous errors
              dispatch(clearError());
              setStatus({});
              
              // Prepare login data based on selected method
              const loginData = {
                password: values.password,
                ...(values.loginMethod === 'email' 
                  ? { email: values.email, phone: undefined }
                  : { phone: values.phone, email: undefined }
                )
              };

              await dispatch(loginUser(loginData)).unwrap();
              setStatus({ success: 'Login successful! Redirecting...' });
            } catch (err) {
              const errorMessage = err?.error?.message || err?.message || 'Login failed. Please try again.';
              setStatus({ error: errorMessage });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, isValid, dirty, status, setStatus, values, setFieldValue }) => (
            <Form
              className="space-y-6"
              onChange={() => {
                if (status?.error) setStatus({}); // Clear error on input change
                if (reduxError) dispatch(clearError()); // Clear Redux error
              }}
            >
              {/* Login Method Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Login with
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue('loginMethod', 'email');
                      setFieldValue('phone', '');
                    }}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                      values.loginMethod === 'email'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue('loginMethod', 'phone');
                      setFieldValue('email', '');
                    }}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                      values.loginMethod === 'phone'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </button>
                </div>
              </div>

              {/* Email Field */}
              {values.loginMethod === 'email' && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              )}

              {/* Phone Field */}
              {values.loginMethod === 'phone' && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Field
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  <ErrorMessage
                    name="phone"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

              {/* Error and Success Messages */}
              {(status?.error || reduxError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-700 text-sm text-center">
                    {status?.error || reduxError}
                  </div>
                </div>
              )}
              {status?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-700 text-sm text-center">{status.success}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isValid || !dirty || loading}
                className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 ${
                  isValid && dirty && !loading
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting || loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </Form>
          )}
        </Formik>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Create Account
            </a>
          </p>
        </div>

        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </div>
    </div>
  );
};

export default Login;