class SpotifyClone {
  constructor() {
    this.currentUser = localStorage.getItem("currentUser")
    this.currentSong = null
    this.isPlaying = false
    this.currentPlaylist = []
    this.currentIndex = 0
    this.audioPlayer = document.getElementById("audioPlayer")

    this.init()
    this.checkAuth()
    this.loadUserMusic()
  }

  init() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => this.handleNavigation(e))
    })

    // Search functionality
    document.getElementById("searchBtn").addEventListener("click", () => this.handleSearch())
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch()
    })

    // Upload functionality
    document.getElementById("uploadBtn").addEventListener("click", () => this.showUploadModal())
    document.querySelector(".close-upload").addEventListener("click", () => this.closeUploadModal())
    document.getElementById("browseBtn").addEventListener("click", () => document.getElementById("fileInput").click())
    document.getElementById("fileInput").addEventListener("change", (e) => this.handleFileSelect(e))

    // Drag and drop
    const uploadArea = document.getElementById("uploadArea")
    uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e))
    uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e))
    uploadArea.addEventListener("drop", (e) => this.handleDrop(e))

    // Player controls
    document.getElementById("playPauseBtn").addEventListener("click", () => this.togglePlayPause())
    document.getElementById("prevBtn").addEventListener("click", () => this.previousSong())
    document.getElementById("nextBtn").addEventListener("click", () => this.nextSong())
    document.getElementById("progressSlider").addEventListener("input", (e) => this.seekTo(e))
    document.getElementById("volumeSlider").addEventListener("input", (e) => this.setVolume(e))

    // Audio player events
    this.audioPlayer.addEventListener("loadedmetadata", () => this.updateDuration())
    this.audioPlayer.addEventListener("timeupdate", () => this.updateProgress())
    this.audioPlayer.addEventListener("ended", () => this.nextSong())

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => this.logout())

    // Library filters
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.filterLibrary(e))
    })

    // Modal close on outside click
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("uploadModal")) {
        this.closeUploadModal()
      }
    })
  }

  checkAuth() {
    if (!this.currentUser) {
      window.location.href = "login.html"
      return
    }

    // Check if login is still valid (within 24 hours)
    const loginTime = localStorage.getItem("loginTime")
    const now = Date.now()
    const dayInMs = 24 * 60 * 60 * 1000

    if (!loginTime || now - Number.parseInt(loginTime) > dayInMs) {
      this.logout()
      return
    }

    // Display user email
    document.getElementById("userEmail").textContent = this.currentUser
  }

  handleNavigation(e) {
    e.preventDefault()
    const section = e.target.closest(".nav-link").dataset.section

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
    e.target.closest(".nav-link").classList.add("active")

    // Show corresponding section
    document.querySelectorAll(".content-section").forEach((section) => section.classList.remove("active"))
    document.getElementById(section + "Section").classList.add("active")

    // Load section content
    this.loadSectionContent(section)
  }

  loadSectionContent(section) {
    switch (section) {
      case "home":
        this.loadHomeContent()
        break
      case "search":
        this.loadSearchContent()
        break
      case "library":
        this.loadLibraryContent()
        break
    }
  }

  loadHomeContent() {
    const recentlyPlayed = this.getRecentlyPlayed()
    const yourMusic = this.getUserMusic()

    this.renderMusicGrid("recentlyPlayed", recentlyPlayed.slice(0, 6))
    this.renderMusicGrid("yourMusic", yourMusic.slice(0, 6))
  }

  loadSearchContent() {
    document.getElementById("searchResults").innerHTML =
      '<p style="color: #b3b3b3; text-align: center; margin-top: 40px;">Search for your favorite music</p>'
  }

  loadLibraryContent() {
    const music = this.getUserMusic()
    this.renderMusicList("libraryContent", music)
  }

  handleSearch() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim()
    if (!query) return

    const allMusic = this.getUserMusic()
    const results = allMusic.filter(
      (song) => song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query),
    )

    this.renderMusicGrid("searchResults", results)

    // Switch to search section
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
    document.querySelector('[data-section="search"]').classList.add("active")
    document.querySelectorAll(".content-section").forEach((section) => section.classList.remove("active"))
    document.getElementById("searchSection").classList.add("active")
  }

  showUploadModal() {
    document.getElementById("uploadModal").style.display = "block"
  }

  closeUploadModal() {
    document.getElementById("uploadModal").style.display = "none"
    document.getElementById("uploadProgress").style.display = "none"
    document.getElementById("progressFill").style.width = "0%"
  }

  handleDragOver(e) {
    e.preventDefault()
    e.target.closest(".upload-area").classList.add("dragover")
  }

  handleDragLeave(e) {
    e.preventDefault()
    e.target.closest(".upload-area").classList.remove("dragover")
  }

  handleDrop(e) {
    e.preventDefault()
    e.target.closest(".upload-area").classList.remove("dragover")
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "audio/mpeg")
    if (files.length > 0) {
      this.uploadFiles(files)
    }
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      this.uploadFiles(files)
    }
  }

  async uploadFiles(files) {
    document.getElementById("uploadProgress").style.display = "block"
    const progressFill = document.getElementById("progressFill")
    const uploadStatus = document.getElementById("uploadStatus")

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      uploadStatus.textContent = `Uploading ${file.name}... (${i + 1}/${files.length})`

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        progressFill.style.width = progress + "%"
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Save file to localStorage (in real app, you'd upload to server)
      await this.saveAudioFile(file)
    }

    uploadStatus.textContent = "Upload complete!"
    setTimeout(() => {
      this.closeUploadModal()
      this.loadUserMusic()
      this.showMessage("Music uploaded successfully!", "success")
    }, 1000)
  }

  async saveAudioFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const audioData = e.target.result
        const fileName = file.name.replace(".mp3", "")
        const [title, artist] = fileName.includes(" - ") ? fileName.split(" - ") : [fileName, "Unknown Artist"]

        const song = {
          id: Date.now() + Math.random(),
          title: title.trim(),
          artist: artist.trim(),
          duration: 0, // Will be set when audio loads
          audioData: audioData,
          uploadedAt: Date.now(),
        }

        // Save to user's music library
        const userMusic = JSON.parse(localStorage.getItem(`music_${this.currentUser}`) || "[]")
        userMusic.push(song)
        localStorage.setItem(`music_${this.currentUser}`, JSON.stringify(userMusic))

        resolve()
      }
      reader.readAsDataURL(file)
    })
  }

  loadUserMusic() {
    // Load user's music and update displays
    this.loadHomeContent()
    if (document.getElementById("librarySection").classList.contains("active")) {
      this.loadLibraryContent()
    }
  }

  getUserMusic() {
    return JSON.parse(localStorage.getItem(`music_${this.currentUser}`) || "[]")
  }

  getRecentlyPlayed() {
    const recentlyPlayed = JSON.parse(localStorage.getItem(`recent_${this.currentUser}`) || "[]")
    const userMusic = this.getUserMusic()
    return recentlyPlayed.map((id) => userMusic.find((song) => song.id === id)).filter(Boolean)
  }

  addToRecentlyPlayed(songId) {
    let recent = JSON.parse(localStorage.getItem(`recent_${this.currentUser}`) || "[]")
    recent = recent.filter((id) => id !== songId) // Remove if already exists
    recent.unshift(songId) // Add to beginning
    recent = recent.slice(0, 10) // Keep only last 10
    localStorage.setItem(`recent_${this.currentUser}`, JSON.stringify(recent))
  }

  renderMusicGrid(containerId, songs) {
    const container = document.getElementById(containerId)
    if (!songs.length) {
      container.innerHTML = '<p style="color: #b3b3b3; text-align: center; grid-column: 1 / -1;">No music found</p>'
      return
    }

    container.innerHTML = songs
      .map(
        (song) => `
            <div class="music-card" onclick="spotifyApp.playSong(${song.id})">
                <div class="card-cover">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="#b3b3b3">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                    <button class="play-button" onclick="event.stopPropagation(); spotifyApp.playSong(${song.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
                <div class="card-title">${song.title}</div>
                <div class="card-artist">${song.artist}</div>
            </div>
        `,
      )
      .join("")
  }

  renderMusicList(containerId, songs) {
    const container = document.getElementById(containerId)
    if (!songs.length) {
      container.innerHTML =
        '<p style="color: #b3b3b3; text-align: center; margin-top: 40px;">No music in your library</p>'
      return
    }

    container.innerHTML = songs
      .map(
        (song) => `
            <div class="list-item" onclick="spotifyApp.playSong(${song.id})">
                <div class="list-cover">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#b3b3b3">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                </div>
                <div class="list-info">
                    <div class="list-title">${song.title}</div>
                    <div class="list-artist">${song.artist}</div>
                </div>
            </div>
        `,
      )
      .join("")
  }

  playSong(songId) {
    const userMusic = this.getUserMusic()
    const song = userMusic.find((s) => s.id === songId)
    if (!song) return

    this.currentSong = song
    this.currentPlaylist = userMusic
    this.currentIndex = userMusic.findIndex((s) => s.id === songId)

    // Update player UI
    document.getElementById("currentSongTitle").textContent = song.title
    document.getElementById("currentSongArtist").textContent = song.artist

    // Load and play audio
    this.audioPlayer.src = song.audioData
    this.audioPlayer.play()
    this.isPlaying = true
    this.updatePlayButton()

    // Add to recently played
    this.addToRecentlyPlayed(songId)
  }

  togglePlayPause() {
    if (!this.currentSong) return

    if (this.isPlaying) {
      this.audioPlayer.pause()
    } else {
      this.audioPlayer.play()
    }
    this.isPlaying = !this.isPlaying
    this.updatePlayButton()
  }

  updatePlayButton() {
    const playBtn = document.getElementById("playPauseBtn")
    playBtn.innerHTML = this.isPlaying
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
  }

  previousSong() {
    if (this.currentPlaylist.length === 0) return
    this.currentIndex = (this.currentIndex - 1 + this.currentPlaylist.length) % this.currentPlaylist.length
    this.playSong(this.currentPlaylist[this.currentIndex].id)
  }

  nextSong() {
    if (this.currentPlaylist.length === 0) return
    this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.length
    this.playSong(this.currentPlaylist[this.currentIndex].id)
  }

  seekTo(e) {
    if (!this.currentSong) return
    const seekTime = (e.target.value / 100) * this.audioPlayer.duration
    this.audioPlayer.currentTime = seekTime
  }

  setVolume(e) {
    this.audioPlayer.volume = e.target.value / 100
  }

  updateDuration() {
    const duration = this.formatTime(this.audioPlayer.duration)
    document.getElementById("totalTime").textContent = duration
  }

  updateProgress() {
    if (!this.audioPlayer.duration) return

    const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100
    document.getElementById("progress").style.width = progress + "%"
    document.getElementById("progressSlider").value = progress
    document.getElementById("currentTime").textContent = this.formatTime(this.audioPlayer.currentTime)
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  filterLibrary(e) {
    document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"))
    e.target.classList.add("active")

    const filter = e.target.dataset.filter
    const music = this.getUserMusic()

    // For now, all music is treated as songs. In a real app, you'd have different types
    this.renderMusicList("libraryContent", music)
  }

  logout() {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("loginTime")
    window.location.href = "login.html"
  }

  showMessage(message, type) {
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
            z-index: 2000;
            animation: slideIn 0.3s ease;
            background: ${type === "success" ? "#1DB954" : "#e22134"};
        `

    document.body.appendChild(messageDiv)

    setTimeout(() => {
      messageDiv.remove()
    }, 3000)
  }
}

// Initialize the app
const spotifyApp = new SpotifyClone()

// Add some sample music for demo purposes
if (
  !localStorage.getItem(`music_${spotifyApp.currentUser}`) ||
  JSON.parse(localStorage.getItem(`music_${spotifyApp.currentUser}`)).length === 0
) {
  const sampleMusic = [
    {
      id: 1,
      title: "Sample Song 1",
      artist: "Demo Artist",
      duration: 180,
      audioData: null,
      uploadedAt: Date.now() - 86400000,
    },
    {
      id: 2,
      title: "Sample Song 2",
      artist: "Demo Artist",
      duration: 210,
      audioData: null,
      uploadedAt: Date.now() - 172800000,
    },
  ]
  localStorage.setItem(`music_${spotifyApp.currentUser}`, JSON.stringify(sampleMusic))
  spotifyApp.loadUserMusic()
}
