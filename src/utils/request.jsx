import axios from 'axios';
import Cookies from 'js-cookie';
// import toast from 'node_modules/react-hot-toast/dist';
import toast from 'react-hot-toast';

const request = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_HOST}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // "Content-Type": "application/json, multipart/form-data",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
});
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
  // store.dispatch(getLoginData({}))
  localStorage.clear();
  Cookies.remove('token');
  setTimeout(() => {
    window.location.href = '/sign-in';
  }, 2000);

  // return error;
};

const errorHandler = error => {
  console.log(error);
  if (error.response && error.response.status === 401) {
    expiredTokenHandler();
    toast.error(error?.response?.data?.message);
  } else if (error.code === 'ERR_NETWORK') {
    window.history.pushState({}, 'Redirect Network Error', '/sign-in');
    console.log(error);
    if (error.response?.status === 401) {
      expiredTokenHandler();
    }
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
