/**
 * Solar System Auth & User Session Management
 */

// Helper to retrieve users array from localStorage
function getUsers() {
    const data = localStorage.getItem("solar_users");
    return data ? JSON.parse(data) : [];
}

// Helper to save users array to localStorage
function saveUsers(users) {
    localStorage.setItem("solar_users", JSON.stringify(users));
}

// Helper to retrieve logged-in user session
export function getCurrentUser() {
    const data = localStorage.getItem("solar_current_user");
    return data ? JSON.parse(data) : null;
}

// Helper to set logged-in user session
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem("solar_current_user", JSON.stringify(user));
    } else {
        localStorage.removeItem("solar_current_user");
    }
}

// Register a new user
export function registerUser(name, email, password, favoritePlanet = "Earth") {
    const users = getUsers();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = users.find(u => u.email === cleanEmail);
    if (existing) {
        return { success: false, message: "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk." };
    }

    const newUser = {
        id: "user_" + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: password, // client-side local storage demo
        favoritePlanet: favoritePlanet,
        joinedDate: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
}

// Login user
export function loginUser(email, password) {
    const users = getUsers();
    const cleanEmail = email.trim().toLowerCase();

    const user = users.find(u => u.email === cleanEmail && u.password === password);

    if (!user) {
        return { success: false, message: "Email atau password yang Anda masukkan salah." };
    }

    setCurrentUser(user);
    return { success: true, user };
}

// Logout user
export function logoutUser() {
    setCurrentUser(null);
    window.location.href = "index.html";
}

// Update user profile details
export function updateUserProfile(newName, newFavoritePlanet) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, message: "Sesi tidak ditemukan." };

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        users[userIndex].name = newName.trim();
        users[userIndex].favoritePlanet = newFavoritePlanet;
        saveUsers(users);
    }

    currentUser.name = newName.trim();
    currentUser.favoritePlanet = newFavoritePlanet;
    setCurrentUser(currentUser);

    return { success: true, user: currentUser };
}

// Global Auth UI Sync for Navbars and Hero Buttons
export function initAuthUI() {
    const currentUser = getCurrentUser();

    // 1. Update Hero Auth Button (on index.html if present)
    const heroAuthBtn = document.querySelector(".hero-auth-button");
    if (heroAuthBtn) {
        if (currentUser) {
            heroAuthBtn.textContent = "Profil";
            heroAuthBtn.href = "profile.html";
        } else {
            heroAuthBtn.textContent = "Login / Register";
            heroAuthBtn.href = "login.html";
        }
    }

    // 2. Update Nav Links (on detail pages and main nav if present)
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
        if (currentUser) {
            navLinks.innerHTML = `
                <a class="nav-link" href="index.html">Beranda</a>
                <a class="nav-link" href="profile.html" style="color: var(--primary); font-weight: 700;">Profil (${currentUser.name})</a>
                <button id="nav-logout-btn" class="button-primary" style="padding: 8px 16px; font-size: 14px;">Keluar</button>
            `;
            const logoutBtn = document.querySelector("#nav-logout-btn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => logoutUser());
            }
        } else {
            navLinks.innerHTML = `
                <a class="nav-link" href="index.html">Beranda</a>
                <a class="button-primary" href="login.html" style="padding: 8px 16px; font-size: 14px;">Masuk / Daftar</a>
            `;
        }
    }
}

function showMessage(element, message, type) { element.textContent = message; element.className = "alert-message alert-message--" + type; element.style.display = "block"; }
function initLoginForm() { const form = document.querySelector("#login-form"); if (!form) return; form.addEventListener("submit", event => { event.preventDefault(); const result = loginUser(form.email.value, form.password.value); const message = form.querySelector(".alert-message"); if (!result.success) return showMessage(message, result.message, "error"); showMessage(message, "Berhasil masuk. Mengalihkan ke beranda…", "success"); window.setTimeout(() => { window.location.href = "index.html"; }, 500); }); }
function initRegisterForm() { const form = document.querySelector("#register-form"); if (!form) return; form.addEventListener("submit", event => { event.preventDefault(); const message = form.querySelector(".alert-message"); if (form.password.value !== form.confirmPassword.value) return showMessage(message, "Konfirmasi password belum sama.", "error"); const result = registerUser(form.name.value, form.email.value, form.password.value); if (!result.success) return showMessage(message, result.message, "error"); showMessage(message, "Akun berhasil dibuat. Mengalihkan ke beranda…", "success"); window.setTimeout(() => { window.location.href = "index.html"; }, 500); }); }

function initProfilePage() { const avatar = document.querySelector("#profile-avatar"); if (!avatar) return; const user = getCurrentUser(); if (!user) return window.location.replace("login.html"); avatar.textContent = user.name.charAt(0); document.querySelector("#profile-name").textContent = user.name; document.querySelector("#profile-email").textContent = user.email; document.querySelector("#profile-joined-date").textContent = user.joinedDate; document.querySelector("#profile-favorite-planet").textContent = user.favoritePlanet || "Earth"; document.querySelector("#profile-logout-btn").addEventListener("click", logoutUser); }

// Auto-run UI sync on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initAuthUI();
    initLoginForm();
    initRegisterForm();
    initProfilePage();
});
