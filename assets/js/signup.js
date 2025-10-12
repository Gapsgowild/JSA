// Check if user is already logged in
if (localStorage.getItem("spotifyUser")) {
  window.location.href = "/index.html"
}

// Check and reset passwords daily
function checkPasswordReset() {
  const lastReset = localStorage.getItem("lastPasswordReset")
  const today = new Date().toDateString()

  if (lastReset !== today) {
    const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")
    for (const email in users) {
      delete users[email].password
    }
    localStorage.setItem("spotifyUsers", JSON.stringify(users))
    localStorage.setItem("lastPasswordReset", today)
  }
}

checkPasswordReset()

const form = document.getElementById("signup-form")
const firstNameInput = document.getElementById("firstName")
const surnameInput = document.getElementById("surname")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const errorMessage = document.getElementById("error-message")
const passwordRequirements = document.getElementById("password-requirements")

function validatePassword(password) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  }
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
  passwordRequirements.classList.add("show")
})

passwordInput.addEventListener("input", () => {
  updatePasswordRequirements(passwordInput.value)
})

passwordInput.addEventListener("blur", () => {
  setTimeout(() => {
    passwordRequirements.classList.remove("show")
  }, 200)
})

form.addEventListener("submit", (e) => {
  e.preventDefault()

  const firstName = firstNameInput.value.trim()
  const surname = surnameInput.value.trim()
  const email = emailInput.value.trim()
  const password = passwordInput.value

  errorMessage.textContent = ""

  if (!firstName || !surname || !email || !password) {
    errorMessage.textContent = "Please fill in all fields"
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errorMessage.textContent = "Please enter a valid email address"
    return
  }

  const requirements = validatePassword(password)
  const allRequirementsMet = Object.values(requirements).every((req) => req)

  if (!allRequirementsMet) {
    errorMessage.textContent = "Password does not meet all requirements"
    passwordRequirements.classList.add("show")
    updatePasswordRequirements(password)
    return
  }

  const users = JSON.parse(localStorage.getItem("spotifyUsers") || "{}")

  if (users[email] && users[email].password) {
    errorMessage.textContent = "Account already exists. Please log in."
    return
  }

  users[email] = {
    firstName: firstName,
    surname: surname,
    password: password,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem("spotifyUsers", JSON.stringify(users))
  localStorage.setItem("spotifyUser", email)
  window.location.href = "/index.html"
})
