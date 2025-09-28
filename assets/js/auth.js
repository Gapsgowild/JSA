// Authentication middleware and utilities
class AuthSystem {
  constructor() {
    this.init()
  }

  init() {
    // Check authentication on page load
    this.checkAuthOnLoad()

    // Set up periodic auth checks
    this.setupPeriodicChecks()

    // Handle browser storage events
    window.addEventListener("storage", (e) => this.handleStorageChange(e))
  }

  checkAuthOnLoad() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html"
    const isLoginPage = currentPage === "login.html"
    const currentUser = localStorage.getItem("currentUser")
    const loginTime = localStorage.getItem("loginTime")

    // If on login page and already authenticated, redirect to main app
    if (isLoginPage && this.isValidSession(currentUser, loginTime)) {
      window.location.href = "index.html"
      return
    }

    // If not on login page and not authenticated, redirect to login
    if (!isLoginPage && !this.isValidSession(currentUser, loginTime)) {
      this.redirectToLogin()
      return
    }

    // Check for daily password reset
    this.checkDailyPasswordReset()
  }

  isValidSession(currentUser, loginTime) {
    if (!currentUser || !loginTime) return false

    const now = Date.now()
    const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours

    return now - Number.parseInt(loginTime) < sessionDuration
  }

  checkDailyPasswordReset() {
    const lastReset = localStorage.getItem("lastPasswordReset")
    const today = new Date().toDateString()

    if (lastReset !== today) {
      this.performDailyPasswordReset()
    }
  }

  performDailyPasswordReset() {
    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")
    let resetCount = 0

    // Reset all user passwords
    Object.keys(users).forEach((email) => {
      const newPassword = this.generateSecurePassword()
      users[email].password = newPassword
      users[email].passwordResetAt = Date.now()
      resetCount++

      // Log password reset for demo purposes (in real app, send email)
      console.log(`Password reset for ${email}: ${newPassword}`)
    })

    if (resetCount > 0) {
      localStorage.setItem("spotifyUsers", JSON.stringify(users))
      localStorage.setItem("lastPasswordReset", new Date().toDateString())

      // Clear all active sessions
      localStorage.removeItem("currentUser")
      localStorage.removeItem("loginTime")

      // Show notification if not on login page
      if (!window.location.pathname.includes("login.html")) {
        this.showPasswordResetNotification()
        setTimeout(() => this.redirectToLogin(), 3000)
      }
    }
  }

  generateSecurePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  setupPeriodicChecks() {
    // Check authentication every 5 minutes
    setInterval(
      () => {
        const currentUser = localStorage.getItem("currentUser")
        const loginTime = localStorage.getItem("loginTime")

        if (!this.isValidSession(currentUser, loginTime)) {
          this.handleSessionExpiry()
        }
      },
      5 * 60 * 1000,
    )
  }

  handleStorageChange(e) {
    // Handle changes to authentication data from other tabs
    if (e.key === "currentUser" || e.key === "loginTime") {
      if (!e.newValue) {
        // User logged out in another tab
        this.redirectToLogin()
      }
    }
  }

  handleSessionExpiry() {
    this.clearSession()
    this.showSessionExpiredMessage()
    setTimeout(() => this.redirectToLogin(), 2000)
  }

  clearSession() {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("loginTime")
  }

  redirectToLogin() {
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html"
    }
  }

  showPasswordResetNotification() {
    this.showMessage("Daily password reset completed. Please log in with your new password.", "info")
  }

  showSessionExpiredMessage() {
    this.showMessage("Your session has expired. Please log in again.", "warning")
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector(".auth-message")
    if (existingMessage) {
      existingMessage.remove()
    }

    const messageDiv = document.createElement("div")
    messageDiv.className = `auth-message ${type}`
    messageDiv.textContent = message

    const colors = {
      info: "#1DB954",
      warning: "#ff9500",
      error: "#e22134",
      success: "#1DB954",
    }

    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 3000;
            animation: slideDown 0.3s ease;
            background: ${colors[type] || colors.info};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 90%;
            text-align: center;
        `

    // Add animation styles
    if (!document.querySelector("#auth-animations")) {
      const style = document.createElement("style")
      style.id = "auth-animations"
      style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `
      document.head.appendChild(style)
    }

    document.body.appendChild(messageDiv)

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, 5000)
  }

  // Utility methods for other scripts
  getCurrentUser() {
    return localStorage.getItem("currentUser")
  }

  isAuthenticated() {
    const currentUser = localStorage.getItem("currentUser")
    const loginTime = localStorage.getItem("loginTime")
    return this.isValidSession(currentUser, loginTime)
  }

  login(email, password) {
    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (users[email] && users[email].password === password) {
      localStorage.setItem("currentUser", email)
      localStorage.setItem("loginTime", Date.now().toString())
      return { success: true, message: "Login successful" }
    }

    return { success: false, message: "Invalid credentials" }
  }

  register(email, password, confirmPassword) {
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" }
    }

    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (users[email]) {
      return { success: false, message: "Account already exists" }
    }

    users[email] = {
      password: password,
      createdAt: Date.now(),
      lastLogin: null,
    }

    localStorage.setItem("spotifyUsers", JSON.stringify(users))
    return { success: true, message: "Account created successfully" }
  }

  logout() {
    this.clearSession()
    this.redirectToLogin()
  }

  resetPassword(email, newPassword) {
    if (newPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" }
    }

    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (!users[email]) {
      return { success: false, message: "Account not found" }
    }

    users[email].password = newPassword
    users[email].passwordResetAt = Date.now()
    localStorage.setItem("spotifyUsers", JSON.stringify(users))

    return { success: true, message: "Password reset successfully" }
  }
}

// Initialize authentication system
const authSystem = new AuthSystem()

// Make auth system globally available
window.authSystem = authSystem
