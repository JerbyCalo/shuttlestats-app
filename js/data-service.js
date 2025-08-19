// Firebase Data Service - Replaces localStorage with Firestore
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class DataService {
  constructor() {
    this.currentUserId = null;
    this.listeners = new Map(); // Store real-time listeners
  }

  // Set current user ID
  setCurrentUser(userId) {
    // If switching users, clear any existing listeners
    if (this.currentUserId && this.currentUserId !== userId) {
      this.unsubscribeAll();
    }
    this.currentUserId = userId || null;
  }

  // Explicitly clear the current user
  clearCurrentUser() {
    this.unsubscribeAll();
    this.currentUserId = null;
  }

  // Training Sessions
  async getTrainingSessions() {
    if (!this.currentUserId) return [];

    try {
      const q = query(
        collection(db, "training_sessions"),
        where("userId", "==", this.currentUserId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting training sessions:", error);
      return [];
    }
  }

  async addTrainingSession(sessionData) {
    if (!this.currentUserId) throw new Error("User not authenticated");

    try {
      const docRef = await addDoc(collection(db, "training_sessions"), {
        ...sessionData,
        userId: this.currentUserId,
        createdAt: new Date(),
      });

      return { id: docRef.id, ...sessionData };
    } catch (error) {
      console.error("Error adding training session:", error);
      throw error;
    }
  }

  async updateTrainingSession(sessionId, updates) {
    try {
      const sessionRef = doc(db, "training_sessions", sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating training session:", error);
      throw error;
    }
  }

  async deleteTrainingSession(sessionId) {
    try {
      await deleteDoc(doc(db, "training_sessions", sessionId));
      return true;
    } catch (error) {
      console.error("Error deleting training session:", error);
      throw error;
    }
  }

  // Matches
  async getMatches() {
    if (!this.currentUserId) return [];

    try {
      const q = query(
        collection(db, "matches"),
        where("userId", "==", this.currentUserId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting matches:", error);
      return [];
    }
  }

  async addMatch(matchData) {
    if (!this.currentUserId) throw new Error("User not authenticated");

    try {
      const docRef = await addDoc(collection(db, "matches"), {
        ...matchData,
        userId: this.currentUserId,
        createdAt: new Date(),
      });

      return { id: docRef.id, ...matchData };
    } catch (error) {
      console.error("Error adding match:", error);
      throw error;
    }
  }

  async updateMatch(matchId, updates) {
    try {
      const matchRef = doc(db, "matches", matchId);
      await updateDoc(matchRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  }

  async deleteMatch(matchId) {
    try {
      await deleteDoc(doc(db, "matches", matchId));
      return true;
    } catch (error) {
      console.error("Error deleting match:", error);
      throw error;
    }
  }

  // Schedule Sessions
  async getScheduleSessions() {
    if (!this.currentUserId) return [];

    try {
      const q = query(
        collection(db, "schedule_sessions"),
        where("userId", "==", this.currentUserId),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting schedule sessions:", error);
      return [];
    }
  }

  async addScheduleSession(sessionData) {
    if (!this.currentUserId) throw new Error("User not authenticated");

    try {
      const docRef = await addDoc(collection(db, "schedule_sessions"), {
        ...sessionData,
        userId: this.currentUserId,
        createdAt: new Date(),
      });

      return { id: docRef.id, ...sessionData };
    } catch (error) {
      console.error("Error adding schedule session:", error);
      throw error;
    }
  }

  async updateScheduleSession(sessionId, updates) {
    try {
      const sessionRef = doc(db, "schedule_sessions", sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating schedule session:", error);
      throw error;
    }
  }

  async deleteScheduleSession(sessionId) {
    try {
      await deleteDoc(doc(db, "schedule_sessions", sessionId));
      return true;
    } catch (error) {
      console.error("Error deleting schedule session:", error);
      throw error;
    }
  }

  // Goals
  async getGoals() {
    if (!this.currentUserId) return [];

    try {
      const q = query(
        collection(db, "goals"),
        where("userId", "==", this.currentUserId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting goals:", error);
      return [];
    }
  }

  async addGoal(goalData) {
    if (!this.currentUserId) throw new Error("User not authenticated");

    try {
      const payload = {
        title: goalData.title || "Untitled Goal",
        description: goalData.description || "",
        targetDate: goalData.targetDate || null,
        completed: !!goalData.completed,
        userId: this.currentUserId,
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "goals"), payload);
      return { id: docRef.id, ...payload };
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  }

  async updateGoal(goalId, updates) {
    try {
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, { ...updates, updatedAt: new Date() });
      return true;
    } catch (error) {
      console.error("Error updating goal:", error);
      throw error;
    }
  }

  async deleteGoal(goalId) {
    try {
      await deleteDoc(doc(db, "goals", goalId));
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToTrainingSessions(callback) {
    if (!this.currentUserId) return null;

    const q = query(
      collection(db, "training_sessions"),
      where("userId", "==", this.currentUserId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(sessions);
    });

    this.listeners.set("training_sessions", unsubscribe);
    return unsubscribe;
  }

  subscribeToMatches(callback) {
    if (!this.currentUserId) return null;

    const q = query(
      collection(db, "matches"),
      where("userId", "==", this.currentUserId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(matches);
    });

    this.listeners.set("matches", unsubscribe);
    return unsubscribe;
  }

  subscribeToScheduleSessions(callback) {
    if (!this.currentUserId) return null;

    const q = query(
      collection(db, "schedule_sessions"),
      where("userId", "==", this.currentUserId),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(sessions);
    });

    this.listeners.set("schedule_sessions", unsubscribe);
    return unsubscribe;
  }

  subscribeToGoals(callback) {
    if (!this.currentUserId) return null;

    const q = query(
      collection(db, "goals"),
      where("userId", "==", this.currentUserId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(goals);
    });

    this.listeners.set("goals", unsubscribe);
    return unsubscribe;
  }

  // Clean up listeners
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  // User preferences
  async getUserPreferences() {
    if (!this.currentUserId) return {};

    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUserId));
      return userDoc.exists() ? userDoc.data().preferences || {} : {};
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return {};
    }
  }

  async updateUserPreferences(preferences) {
    if (!this.currentUserId) throw new Error("User not authenticated");

    try {
      const userRef = doc(db, "users", this.currentUserId);
      await updateDoc(userRef, {
        preferences: preferences,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }
}

// Create and export data service instance
export const dataService = new DataService();
