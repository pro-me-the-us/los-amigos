const crypto = require("crypto");

class User {
  constructor({ id, username, role }) {
    this.id = id;
    this.username = username;
    this.role = role;
  }

  isAdmin() {
    return this.role === "admin";
  }

  isDeveloper() {
    return this.role === "developer";
  }
}

class AuthenticationService {
  constructor({ userStore, tokenStore } = {}) {
    this.userStore = userStore || new Map();
    this.tokenStore = tokenStore || new Map();
    this.nextId = 1;
  }

  addUser(username, password, role = "developer") {
    if (this.userStore.has(username)) {
      throw new Error("User already exists");
    }

    const user = new User({
      id: this.nextId++,
      username,
      role,
    });

    this.userStore.set(username, { user, password });
    return user;
  }

  authenticate(username, password) {
    const record = this.userStore.get(username);
    if (!record || record.password !== password) {
      return null;
    }

    const token = crypto.randomBytes(16).toString("hex");
    this.tokenStore.set(token, record.user);
    return token;
  }

  validateToken(token) {
    return this.tokenStore.has(token);
  }

  getUserByToken(token) {
    return this.tokenStore.get(token) || null;
  }

  revokeToken(token) {
    this.tokenStore.delete(token);
  }
}

class AdminController {
  constructor({ authService, logService }) {
    this.authService = authService;
    this.logService = logService;
  }

  getSystemLogs(token, filter = {}) {
    const user = this.authService.getUserByToken(token);
    if (!user || !user.isAdmin()) {
      throw new Error("Unauthorized");
    }

    return this.logService.getLogs(filter);
  }
}

module.exports = {
  User,
  AuthenticationService,
  AdminController,
};
