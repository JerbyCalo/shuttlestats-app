// Firebase Authentication Service
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initAuthListener();
  }

  // Listen for authentication state changes
  initAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.updateUI(user);
    });
  }

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save additional user data to Firestore
      await this.saveUserProfile(user.uid, {
        email: user.email,
        createdAt: new Date(),
        role: "player", // default role
        ...userData,
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Save user profile if it's first time
      await this.saveUserProfile(result.user.uid, {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date(),
        role: "player",
      });

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Save user profile to Firestore
  async saveUserProfile(uid, userData) {
    try {
      const { db } = await import("./firebase-config.js");
      const { doc, setDoc } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      await setDoc(doc(db, "users", uid), userData, { merge: true });
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  // Update UI based on authentication state
  updateUI(user) {
    const authElements = document.querySelectorAll("[data-auth]");
    const userElements = document.querySelectorAll("[data-user]");

    if (user) {
      // User is signed in
      authElements.forEach((el) => (el.style.display = "none"));
      userElements.forEach((el) => (el.style.display = "block"));

      // Update user info displays
      const userEmailElements = document.querySelectorAll("[data-user-email]");
      userEmailElements.forEach((el) => (el.textContent = user.email));

      const userNameElements = document.querySelectorAll("[data-user-name]");
      // Use centralized loadUserName if available, otherwise fallback
      if (window.loadUserName && userNameElements.length > 0) {
        window.loadUserName("[data-user-name]");
      } else {
        userNameElements.forEach(
          (el) => (el.textContent = user.displayName || user.email)
        );
      }
    } else {
      // User is signed out
      authElements.forEach((el) => (el.style.display = "block"));
      userElements.forEach((el) => (el.style.display = "none"));
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send password reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid) {
    try {
      const { db } = await import("./firebase-config.js");
      const { doc, getDoc } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
      );

      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Create and export auth service instance
export const authService = new AuthService();
