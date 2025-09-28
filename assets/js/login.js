class AuthManager {
  constructor() {
    this.init()
    this.checkPasswordExpiry()
  }

  init() {
    // Tab switching
    document.getElementById("loginTab").addEventListener("click", () => this.switchTab("login"))
    document.getElementById("signupTab").addEventListener("click", () => this.switchTab("signup"))

    // Form submissions
    document.getElementById("loginForm").addEventListener("submit", (e) => this.handleLogin(e))
    document.getElementById("signupForm").addEventListener("submit", (e) => this.handleSignup(e))
    document.getElementById("resetForm").addEventListener("submit", (e) => this.handlePasswordReset(e))

    // Forgot password
    document.getElementById("forgotPassword").addEventListener("click", (e) => this.showResetModal(e))

    // Modal close
    document.querySelector(".close").addEventListener("click", () => this.closeModal())
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("resetModal")) {
        this.closeModal()
      }
    })
  }

  switchTab(tab) {
    const loginTab = document.getElementById("loginTab")
    const signupTab = document.getElementById("signupTab")
    const loginForm = document.getElementById("loginForm")
    const signupForm = document.getElementById("signupForm")

    if (tab === "login") {
      loginTab.classList.add("active")
      signupTab.classList.remove("active")
      loginForm.classList.add("active")
      signupForm.classList.remove("active")
    } else {
      signupTab.classList.add("active")
      loginTab.classList.remove("active")
      signupForm.classList.add("active")
      loginForm.classList.remove("active")
    }
  }

  handleLogin(e) {
    e.preventDefault()
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (users[email] && users[email].password === password) {
      // Set login session
      localStorage.setItem("currentUser", email)
      localStorage.setItem("loginTime", Date.now().toString())

      this.showMessage("Login successful! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1500)
    } else {
      this.showMessage("Invalid email or password", "error")
    }
  }

  handleSignup(e) {
    e.preventDefault()
    const email = document.getElementById("signupEmail").value
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (password !== confirmPassword) {
      this.showMessage("Passwords do not match", "error")
      return
    }

    if (password.length < 6) {
      this.showMessage("Password must be at least 6 characters long", "error")
      return
    }

    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (users[email]) {
      this.showMessage("Account already exists with this email", "error")
      return
    }

    // Save user
    users[email] = {
      password: password,
      createdAt: Date.now(),
    }
    localStorage.setItem("spotifyUsers", JSON.stringify(users))

    this.showMessage("Account created successfully! You can now log in.", "success")
    this.switchTab("login")

    // Clear signup form
    document.getElementById("signupForm").reset()
  }

  showResetModal(e) {
    e.preventDefault()
    document.getElementById("resetModal").style.display = "block"
  }

  closeModal() {
    document.getElementById("resetModal").style.display = "none"
  }

  handlePasswordReset(e) {
    e.preventDefault()
    const newPassword = document.getElementById("newPassword").value
    const email = document.getElementById("loginEmail").value

    if (!email) {
      this.showMessage("Please enter your email in the login form first", "error")
      this.closeModal()
      return
    }

    if (newPassword.length < 6) {
      this.showMessage("Password must be at least 6 characters long", "error")
      return
    }

    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

    if (users[email]) {
      users[email].password = newPassword
      localStorage.setItem("spotifyUsers", JSON.stringify(users))
      this.showMessage("Password reset successfully!", "success")
      this.closeModal()
      document.getElementById("resetForm").reset()
    } else {
      this.showMessage("No account found with this email", "error")
    }
  }

  checkPasswordExpiry() {
    const lastReset = localStorage.getItem("lastPasswordReset")
    const today = new Date().toDateString()

    if (lastReset !== today) {
      // Reset all passwords daily
      const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")
      Object.keys(users).forEach((email) => {
        users[email].password = this.generateRandomPassword()
      })
      localStorage.setItem("spotifyUsers", JSON.stringify(users))
      localStorage.setItem("lastPasswordReset", today)

      // Clear current session
      localStorage.removeItem("currentUser")
      localStorage.removeItem("loginTime")
    }
  }

  generateRandomPassword() {
    return Math.random().toString(36).slice(-8)
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector(".message")
    if (existingMessage) {
      existingMessage.remove()
    }

    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}`
    messageDiv.textContent = message
    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === "success" ? "#1DB954" : "#e22134"};
        `

    document.body.appendChild(messageDiv)

    setTimeout(() => {
      messageDiv.remove()
    }, 3000)
  }
}

// Add CSS animation
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`
document.head.appendChild(style)

// Initialize auth manager
new AuthManager()
