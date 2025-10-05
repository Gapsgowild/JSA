// Check if user is already logged in
if (localStorage.getItem("spotifyUser")) {
  window.location.href = "/index.html"
}

// Check and reset passwords daily
function checkPasswordReset() {
  const lastReset = localStorage.getItem("lastPasswordReset")
  const today = new Date().toDateString()

  if (lastReset !== today) {
    // Reset all passwords
    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")
    for (const email in users) {
      delete users[email].password
    }
    localStorage.setItem("spotifyUsers", JSON.stringify(users))
    localStorage.setItem("lastPasswordReset", today)
  }
}

checkPasswordReset()

const form = document.getElementById("auth-form")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const errorMessage = document.getElementById("error-message")
const toggleBtn = document.getElementById("toggle-mode")
const formTitle = document.getElementById("form-title")
const submitBtn = document.getElementById("submit-btn")
const toggleText = document.getElementById("toggle-text")
const passwordRequirements = document.getElementById("password-requirements")

let isLoginMode = true

// Password validation
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  }

  return requirements
}

function updatePasswordRequirements(password) {
  const requirements = validatePassword(password)

  document.getElementById("req-length").classList.toggle("valid", requirements.length)
  document.getElementById("req-number").classList.toggle("valid", requirements.number)
  document.getElementById("req-uppercase").classList.toggle("valid", requirements.uppercase)
  document.getElementById("req-special").classList.toggle("valid", requirements.special)

  return Object.values(requirements).every((req) => req)
}

passwordInput.addEventListener("focus", () => {
  if (!isLoginMode) {
    passwordRequirements.style.display = "block"
  }
})

passwordInput.addEventListener("input", () => {
  if (!isLoginMode) {
    updatePasswordRequirements(passwordInput.value)
  }
})

passwordInput.addEventListener("blur", () => {
  setTimeout(() => {
    passwordRequirements.style.display = "none"
  }, 200)
})

// Toggle between login and signup
toggleBtn.addEventListener("click", () => {
  isLoginMode = !isLoginMode

  if (isLoginMode) {
    formTitle.textContent = "Log in to Spotify"
    submitBtn.textContent = "Log In"
    toggleText.textContent = "Don't have an account? Sign up"
    passwordRequirements.style.display = "none"
  } else {
    formTitle.textContent = "Sign up for Spotify"
    submitBtn.textContent = "Sign Up"
    toggleText.textContent = "Already have an account? Log in"
  }

  errorMessage.textContent = ""
  form.reset()
})

// Form submission
form.addEventListener("submit", (e) => {
  e.preventDefault()

  const email = emailInput.value.trim()
  const password = passwordInput.value

  errorMessage.textContent = ""

  if (!email || !password) {
    errorMessage.textContent = "Please fill in all fields"
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errorMessage.textContent = "Please enter a valid email address"
    return
  }

  const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

  if (isLoginMode) {
    // Login
    if (!users[email]) {
      errorMessage.textContent = "Account not found. Please sign up."
      return
    }

    if (!users[email].password) {
      errorMessage.textContent = "Password has been reset. Please sign up again."
      return
    }

    if (users[email].password !== password) {
      errorMessage.textContent = "Incorrect password"
      return
    }

    // Successful login
    localStorage.setItem("spotifyUser", email)
    window.location.href = "/index.html"
  } else {
    // Sign up
    const requirements = validatePassword(password)
    const allRequirementsMet = Object.values(requirements).every((req) => req)

    if (!allRequirementsMet) {
      errorMessage.textContent = "Password does not meet all requirements"
      passwordRequirements.style.display = "block"
      updatePasswordRequirements(password)
      return
    }

    if (users[email] && users[email].password) {
      errorMessage.textContent = "Account already exists. Please log in."
      return
    }

    // Create account
    users[email] = {
      password: password,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem("spotifyUsers", JSON.stringify(users))
    localStorage.setItem("spotifyUser", email)

    console.log("[v0] Account created successfully for:", email)
    window.location.href = "/index.html"
  }
})
