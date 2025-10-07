import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseApp from '../firebase/firebaseConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRole = await fetchUserRole(firebaseUser.uid);
        setUser(firebaseUser);
        setRole(userRole);
        await AsyncStorage.setItem('userToken', firebaseUser.uid);
        await AsyncStorage.setItem('userRole', userRole);
      } else {
        setUser(null);
        setRole(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      // Default to 'employee' if no role is found
      return 'employee';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'employee';
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userRole = await fetchUserRole(firebaseUser.uid);

      setUser(firebaseUser);
      setRole(userRole);
      await AsyncStorage.setItem('userToken', firebaseUser.uid);
      await AsyncStorage.setItem('userRole', userRole);
    } catch (error) {
      console.error(error);
      // Re-throw the error to be handled in the UI
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};