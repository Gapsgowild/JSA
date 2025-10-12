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

const form = document.getElementById("auth-form")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const errorMessage = document.getElementById("error-message")
const toggleButton = document.getElementById("toggle-mode")

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

  localStorage.setItem("spotifyUser", email)
  window.location.href = "/index.html"
})

if (toggleButton) {
  toggleButton.addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "/signup.html"
  })
}
