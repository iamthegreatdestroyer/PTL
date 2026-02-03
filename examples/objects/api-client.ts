/**
 * API client inference examples
 *
 * PTL infers types from HTTP client usage patterns.
 */

// Base API client
class ApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  async request(method, path, body, options = {}) {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  get(path, options) {
    return this.request('GET', path, null, options);
  }

  post(path, body, options) {
    return this.request('POST', path, body, options);
  }

  put(path, body, options) {
    return this.request('PUT', path, body, options);
  }

  patch(path, body, options) {
    return this.request('PATCH', path, body, options);
  }

  delete(path, options) {
    return this.request('DELETE', path, null, options);
  }
}

// Resource-specific clients
class UsersApi extends ApiClient {
  constructor(baseUrl, options) {
    super(baseUrl, options);
  }

  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/users${query ? `?${query}` : ''}`);
  }

  getById(id) {
    return this.get(`/users/${id}`);
  }

  create(userData) {
    return this.post('/users', userData);
  }

  update(id, userData) {
    return this.put(`/users/${id}`, userData);
  }

  partialUpdate(id, userData) {
    return this.patch(`/users/${id}`, userData);
  }

  remove(id) {
    return this.delete(`/users/${id}`);
  }

  getProfile(id) {
    return this.get(`/users/${id}/profile`);
  }

  updateProfile(id, profileData) {
    return this.put(`/users/${id}/profile`, profileData);
  }
}

class ProductsApi extends ApiClient {
  constructor(baseUrl, options) {
    super(baseUrl, options);
  }

  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/products${query ? `?${query}` : ''}`);
  }

  getById(id) {
    return this.get(`/products/${id}`);
  }

  create(productData) {
    return this.post('/products', productData);
  }

  update(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  remove(id) {
    return this.delete(`/products/${id}`);
  }

  search(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters }).toString();
    return this.get(`/products/search?${params}`);
  }

  getCategories() {
    return this.get('/products/categories');
  }

  getByCategory(category) {
    return this.get(`/products/categories/${category}`);
  }
}

// API factory
function createApi(baseUrl, options = {}) {
  return {
    users: new UsersApi(baseUrl, options),
    products: new ProductsApi(baseUrl, options),

    setAuthToken(token) {
      const authHeader = { Authorization: `Bearer ${token}` };
      this.users.headers = { ...this.users.headers, ...authHeader };
      this.products.headers = { ...this.products.headers, ...authHeader };
    },
  };
}

// Usage example
const api = createApi('https://api.example.com');

async function demo() {
  // List users
  const users = await api.users.list({ page: 1, limit: 10 });

  // Get single user
  const user = await api.users.getById('123');

  // Create user
  const newUser = await api.users.create({
    name: 'Alice',
    email: 'alice@example.com',
  });

  // Search products
  const products = await api.products.search('laptop', { minPrice: 500 });

  return { users, user, newUser, products };
}

export { ApiClient, UsersApi, ProductsApi, createApi, demo };
