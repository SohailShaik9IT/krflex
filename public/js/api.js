const KRFlexAPI = (() => {
  function token() { return localStorage.getItem('krflex_token'); }
  function role() { return localStorage.getItem('krflex_role'); }
  function fullName() { return localStorage.getItem('krflex_fullname'); }
  function userId() { return localStorage.getItem('krflex_userid'); }

  function isLoggedIn() { return !!token(); }
  function isAdmin() { return role() === 'Admin'; }

  function setSession({ token: t, role: r, fullName: fn, userId: uid }) {
    localStorage.setItem('krflex_token', t);
    localStorage.setItem('krflex_role', r);
    localStorage.setItem('krflex_fullname', fn);
    localStorage.setItem('krflex_userid', uid);
  }

  function clearSession() {
    localStorage.removeItem('krflex_token');
    localStorage.removeItem('krflex_role');
    localStorage.removeItem('krflex_fullname');
    localStorage.removeItem('krflex_userid');
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token()) headers['Authorization'] = `Bearer ${token()}`;

    const resp = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Login failures also return 401 — don't treat those as an expired session.
    if (resp.status === 401 && path !== '/auth/login') {
      clearSession();
      window.location.href = '/index.html';
      throw new Error('Session expired');
    }

    let data = null;
    const text = await resp.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = text; }
    }

    if (!resp.ok) {
      const message = (data && data.message) || `Request failed (${resp.status})`;
      throw new Error(message);
    }
    return data;
  }

  const get = (path, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', path + qs);
  };
  const post = (path, body) => request('POST', path, body);
  const patch = (path, body) => request('PATCH', path, body);
  const del = (path) => request('DELETE', path);

  async function login(username, password) {
    const result = await post('/auth/login', { username, password });
    setSession(result);
    return result;
  }

  function logout() {
    clearSession();
    window.location.href = '/index.html';
  }

  return { get, post, patch, del, login, logout, isLoggedIn, isAdmin, fullName, role, userId };
})();
