import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  role: string | null;
  dbId: number | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  dbId: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [dbId, setDbId] = useState<number | null>(null); // To map to Python backend IDs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Priority 1: Custom Claims
          const tokenResult = await currentUser.getIdTokenResult(true);
          if (tokenResult.claims.role) {
            setRole(tokenResult.claims.role as string);
          }

          // Priority 2: Firestore DB for role and dbId (if not already set by claims or to get dbId)
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              // Only set role from Firestore if not already set by claims
              if (!tokenResult.claims.role) {
                setRole(data.role);
              }
              setDbId(data.backend_id); // Mapping Firebase UID to integer ID for Python APIs
            } else {
              // If no claims and no Firestore doc, set role to 'Unknown'
              if (!tokenResult.claims.role) {
                setRole('Unknown');
              }
              setDbId(null);
            }
          } catch (firestoreError) {
            console.warn("Firestore error (likely uninitialized):", firestoreError);
            if (!tokenResult.claims.role) setRole('Unknown');
            setDbId(null);
          }
        } catch (error) {
          console.warn("Error fetching Auth Claims:", error);
          setRole(null);
          setDbId(null);
        }
      } else {
        setRole(null);
        setDbId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, dbId, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
