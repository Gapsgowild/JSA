// Check if user is logged in
const currentUser = localStorage.getItem("spotifyUser")
if (!currentUser) {
  window.location.href = "/login.html"
}

// Initialize
let currentTrackIndex = -1
let playlist = []
let isPlaying = false
let currentDetailTrackIndex = -1

const audioPlayer = document.getElementById("audio-player")
const playBtn = document.getElementById("play-btn")
const playIcon = document.getElementById("play-icon")
const pauseIcon = document.getElementById("pause-icon")
const prevBtn = document.getElementById("prev-btn")
const nextBtn = document.getElementById("next-btn")
const progressInput = document.getElementById("progress-input")
const progressFill = document.getElementById("progress-fill")
const currentTimeEl = document.getElementById("current-time")
const durationEl = document.getElementById("duration")
const currentTrackName = document.getElementById("current-track-name")
const player = document.getElementById("player")

// Navigation
const navItems = document.querySelectorAll(".nav-item")
const pages = document.querySelectorAll(".page")
const backBtns = document.querySelectorAll(".back-btn")

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault()
    const pageName = item.dataset.page
    navigateToPage(pageName)
  })
})

backBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault()
    const backTo = btn.dataset.back
    navigateToPage(backTo)
  })
})

function navigateToPage(pageName) {
  navItems.forEach((item) => item.classList.remove("active"))
  pages.forEach((page) => page.classList.remove("active"))

  const targetNav = document.querySelector(`[data-page="${pageName}"]`)
  const targetPage = document.getElementById(`${pageName}-page`)

  if (targetNav) targetNav.classList.add("active")
  if (targetPage) targetPage.classList.add("active")

  if (pageName === "profile") {
    updateProfile()
  } else if (pageName === "list") {
    loadTrackList()
  }
}

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("spotifyUser")
    window.location.href = "/login.html"
  }
})

// Upload functionality
const uploadBox = document.getElementById("upload-box")
const fileInput = document.getElementById("file-input")
const browseBtn = document.getElementById("browse-btn")
const uploadStatus = document.getElementById("upload-status")

browseBtn.addEventListener("click", () => {
  fileInput.click()
})

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files)
})

uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault()
  uploadBox.classList.add("drag-over")
})

uploadBox.addEventListener("dragleave", () => {
  uploadBox.classList.remove("drag-over")
})

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault()
  uploadBox.classList.remove("drag-over")
  handleFiles(e.dataTransfer.files)
})

function handleFiles(files) {
  uploadStatus.innerHTML = ""

  Array.from(files).forEach((file) => {
    if (file.type === "audio/mpeg" || file.name.endsWith(".mp3")) {
      uploadFile(file)
    } else {
      showUploadStatus(file.name, false, "Only MP3 files are supported")
    }
  })
}

function uploadFile(file) {
  const reader = new FileReader()

  reader.onload = (e) => {
    const musicData = {
      name: file.name.replace(".mp3", ""),
      data: e.target.result,
      uploadedAt: new Date().toISOString(),
    }

    // Save to localStorage
    const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
    userMusic.push(musicData)
    localStorage.setItem(`music_${currentUser}`, JSON.stringify(userMusic))

    showUploadStatus(file.name, true, "Uploaded successfully")
    loadMusic()
    if (document.getElementById("list-page").classList.contains("active")) {
      loadTrackList()
    }
  }

  reader.onerror = () => {
    showUploadStatus(file.name, false, "Upload failed")
  }

  reader.readAsDataURL(file)
}

function showUploadStatus(fileName, success, message) {
  const statusItem = document.createElement("div")
  statusItem.className = `status-item ${success ? "success" : "error"}`
  statusItem.innerHTML = `
        <span>${fileName}</span>
        <span>${message}</span>
    `
  uploadStatus.appendChild(statusItem)
}

// Load and display music
function loadMusic() {
  const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
  const musicGrid = document.getElementById("music-grid")

  if (userMusic.length === 0) {
    musicGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a1 1 0 0 1 .993.883L13 3v9.586l3.293-3.293a1 1 0 0 1 1.32-.083l.094.083a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.32.083l-.094-.083-5-5a1 1 0 0 1 1.32-1.497l.094.083L11 13.586V3a1 1 0 0 1 1-1z"/>
                </svg>
                <p>No music uploaded yet</p>
                <p class="empty-subtitle">Upload your first track to get started</p>
            </div>
        `
    playlist = []
    return
  }

  playlist = userMusic

  musicGrid.innerHTML = userMusic
    .map(
      (track, index) => `
        <div class="music-card" data-index="${index}">
            <button class="delete-btn" data-index="${index}">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
            <div class="music-card-image">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
            </div>
            <div class="music-card-title">${track.name}</div>
            <div class="music-card-artist">Unknown Artist</div>
        </div>
    `,
    )
    .join("")

  // Add click handlers
  document.querySelectorAll(".music-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-btn")) {
        const index = Number.parseInt(card.dataset.index)
        playTrack(index)
      }
    })
  })

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const index = Number.parseInt(btn.dataset.index)
      deleteTrack(index)
    })
  })
}

function loadTrackList() {
  const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
  const trackListBody = document.getElementById("track-list-body")

  if (userMusic.length === 0) {
    trackListBody.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a1 1 0 0 1 .993.883L13 3v9.586l3.293-3.293a1 1 0 0 1 1.32-.083l.094.083a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.32.083l-.094-.083-5-5a1 1 0 0 1 1.32-1.497l.094.083L11 13.586V3a1 1 0 0 1 1-1z"/>
        </svg>
        <p>No tracks available</p>
        <p class="empty-subtitle">Upload some music to see it here</p>
      </div>
    `
    return
  }

  trackListBody.innerHTML = userMusic
    .map(
      (track, index) => `
      <div class="track-list-row" data-index="${index}">
        <div class="track-list-col track-col-number">${index + 1}</div>
        <div class="track-list-col track-col-title">
          <div class="track-title-info">
            <div class="track-title-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <div class="track-title-name">${track.name}</div>
              <div class="track-title-artist">Unknown Artist</div>
            </div>
          </div>
        </div>
        <div class="track-list-col track-col-date">${formatDate(track.uploadedAt)}</div>
        <div class="track-list-col track-col-duration">-:--</div>
        <div class="track-list-col track-col-actions">
          <button class="track-action-btn play-track-btn" data-index="${index}" title="Play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5z"/>
            </svg>
          </button>
          <button class="track-action-btn view-track-btn" data-index="${index}" title="View Details">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button class="track-action-btn delete-track-btn" data-index="${index}" title="Delete">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    `,
    )
    .join("")

  // Add event listeners
  document.querySelectorAll(".play-track-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const index = Number.parseInt(btn.dataset.index)
      playTrack(index)
    })
  })

  document.querySelectorAll(".view-track-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const index = Number.parseInt(btn.dataset.index)
      showTrackDetail(index)
    })
  })

  document.querySelectorAll(".delete-track-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const index = Number.parseInt(btn.dataset.index)
      deleteTrack(index)
    })
  })
}

function showTrackDetail(index) {
  currentDetailTrackIndex = index
  const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
  const track = userMusic[index]

  if (!track) return

  document.getElementById("detail-title").textContent = track.name
  document.getElementById("detail-artist").textContent = "Unknown Artist"
  document.getElementById("detail-date").textContent = formatDate(track.uploadedAt)
  document.getElementById("detail-duration").textContent = "-:--"
  document.getElementById("detail-filename").textContent = track.name + ".mp3"
  document.getElementById("detail-uploaded").textContent = new Date(track.uploadedAt).toLocaleString()

  // Set up play button
  const playDetailBtn = document.getElementById("play-detail-btn")
  playDetailBtn.onclick = () => {
    playTrack(index)
  }

  // Set up delete button
  const deleteDetailBtn = document.getElementById("delete-detail-btn")
  deleteDetailBtn.onclick = () => {
    if (confirm("Are you sure you want to delete this track?")) {
      deleteTrack(index)
      navigateToPage("list")
    }
  }

  navigateToPage("detail")
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}

function deleteTrack(index) {
  if (confirm("Are you sure you want to delete this track?")) {
    const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
    userMusic.splice(index, 1)
    localStorage.setItem(`music_${currentUser}`, JSON.stringify(userMusic))

    if (currentTrackIndex === index) {
      audioPlayer.pause()
      player.style.display = "none"
      currentTrackIndex = -1
    } else if (currentTrackIndex > index) {
      currentTrackIndex--
    }

    loadMusic()
    if (document.getElementById("list-page").classList.contains("active")) {
      loadTrackList()
    }
  }
}

function playTrack(index) {
  currentTrackIndex = index
  const track = playlist[index]

  audioPlayer.src = track.data
  audioPlayer.play()
  isPlaying = true

  currentTrackName.textContent = track.name
  player.style.display = "flex"

  updatePlayButton()
}

// Player controls
playBtn.addEventListener("click", () => {
  if (isPlaying) {
    audioPlayer.pause()
  } else {
    audioPlayer.play()
  }
  isPlaying = !isPlaying
  updatePlayButton()
})

prevBtn.addEventListener("click", () => {
  if (currentTrackIndex > 0) {
    playTrack(currentTrackIndex - 1)
  }
})

nextBtn.addEventListener("click", () => {
  if (currentTrackIndex < playlist.length - 1) {
    playTrack(currentTrackIndex + 1)
  }
})

audioPlayer.addEventListener("timeupdate", () => {
  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100
  progressFill.style.width = `${progress}%`
  progressInput.value = progress

  currentTimeEl.textContent = formatTime(audioPlayer.currentTime)
  durationEl.textContent = formatTime(audioPlayer.duration)
})

audioPlayer.addEventListener("ended", () => {
  if (currentTrackIndex < playlist.length - 1) {
    playTrack(currentTrackIndex + 1)
  } else {
    isPlaying = false
    updatePlayButton()
  }
})

progressInput.addEventListener("input", () => {
  const time = (progressInput.value / 100) * audioPlayer.duration
  audioPlayer.currentTime = time
})

function updatePlayButton() {
  if (isPlaying) {
    playIcon.style.display = "none"
    pauseIcon.style.display = "block"
  } else {
    playIcon.style.display = "block"
    pauseIcon.style.display = "none"
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Profile
function updateProfile() {
  document.getElementById("profile-email").textContent = currentUser
  const userMusic = JSON.parse(localStorage.getItem(`music_${currentUser}`) || "[]")
  document.getElementById("track-count").textContent = userMusic.length
}

// Initialize
loadMusic()
