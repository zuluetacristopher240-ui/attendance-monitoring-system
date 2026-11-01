

const API = {

  TIMEOUT: 15000,

  async request(url, options) {
    options = options || {};

    const token = localStorage.getItem("token");

    const config = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }

    if (options.headers) {
      for (const key in options.headers) {
        config.headers[key] = options.headers[key];
      }
    }

    if (options.body) {
      config.body = typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);
    config.signal = controller.signal;

    let response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw new Error("Network error. Please check your connection.");
    }
    clearTimeout(timeoutId);

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiry");

      if (window.location.pathname.indexOf("login.html") === -1) {
        window.location.href = "/pages/login.html";
      }
      throw new Error("Session expired. Please log in again.");
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text.slice(0, 200) };
      }
    }

    if (!response.ok) {
      throw new Error((data && data.message) || "Request failed (HTTP " + response.status + ")");
    }

    return data;
  },

  get(url) {
    return this.request(url);
  },

  post(url, body) {
    return this.request(url, { method: "POST", body: body });
  },

  put(url, body) {
    return this.request(url, { method: "PUT", body: body });
  },

  delete(url) {
    return this.request(url, { method: "DELETE" });
  }
};