import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Pick the backend base URL based on how the dashboard is being accessed.
// - Opened on localhost  -> talk to the local backend (NEXT_PUBLIC_HOST).
// - Opened via ngrok URL  -> talk to the ngrok backend (NEXT_PUBLIC_HOST_NGROK),
//   because a remote browser can't reach the host machine's localhost.
// This lets local dev and the forwarded setup run at the same time.
const resolveBaseURL = () => {
  const local = process.env.NEXT_PUBLIC_HOST;
  const ngrok = process.env.NEXT_PUBLIC_HOST_NGROK;

  if (typeof window === 'undefined') return local; // SSR fallback

  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? local : ngrok || local;
};

const request = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // Skip ngrok's free-tier browser interstitial so XHR gets JSON, not HTML.
    'ngrok-skip-browser-warning': 'true',
  },
  withCredentials: true,
});

let isHandlingAuthFailure = false;

const getApiErrorMessage = error => {
  return error?.response?.data?.error || error?.response?.data?.message || null;
};

const requestHandler = request => {
  let token = Cookies.get('token');

  if (token !== undefined) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
};

const responseHandler = response => {
  return response;
};

const expiredTokenHandler = () => {
  Cookies.remove('token');
  Cookies.remove('user');
  Cookies.remove('username');
  localStorage.removeItem('theme');
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
};

const errorHandler = error => {
  const status = error?.response?.status;
  const apiErrorMessage = getApiErrorMessage(error);

  if (status === 401) {
    if (!isHandlingAuthFailure) {
      isHandlingAuthFailure = true;
      expiredTokenHandler();
      toast.error(apiErrorMessage || 'Sesi telah berakhir');
    }
  } else if (error.code === 'ERR_NETWORK') {
    toast.error('Koneksi jaringan bermasalah');
  } else if (error.response) {
    toast.error(apiErrorMessage || `Terjadi kesalahan (${status})`);
  }

  // Tambahkan ini agar error bisa tertangkap di .catch()
  return Promise.reject(error);
};

const buildMultipart = data => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(file => formData.append(key, file));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

request.interceptors.request.use(
  request => requestHandler(request),
  error => errorHandler(error)
);

request.interceptors.response.use(
  response => responseHandler(response),
  error => errorHandler(error)
);

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  get: (url, params = null, headers = {}) => request({ method: 'get', url, params, headers }),
  post: (url, data, headers = {}) => request({ method: 'post', url, data, headers }),
  postMultipart: (url, data, headers = {}) => {
    const formData = buildMultipart(data);
    return request({
      method: 'post',
      url,
      data: formData,
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  put: (url, data, headers) => request({ method: 'put', url, data, headers }),
  putMultipart: (url, data, headers = {}) => {
    const formData = buildMultipart(data);
    return request({
      method: 'put',
      url,
      data: formData,
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  patch: (url, data, headers) => request({ method: 'patch', url, data, headers }),
  delete: (url, data) => request({ method: 'delete', url, data }),
  setToken: token => {
    if (token) {
      request.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete request.defaults.headers.common.Authorization;
    }
  },
};
