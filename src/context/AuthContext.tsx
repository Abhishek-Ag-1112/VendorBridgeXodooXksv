import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseActive, auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Procurement Officer' | 'Manager/Approver' | 'Vendor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  associatedVendorId?: string; // Links to a Vendor ID if the role is Vendor
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role: UserRole) => Promise<UserProfile>;
  signup: (email: string, name: string, role: UserRole, vendorId?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRoleTesting: (role: UserRole) => void; // Utility to easily test different roles
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pre-seeded local users for offline testing
const LOCAL_USERS_SEED: UserProfile[] = [
  { uid: 'u-admin', email: 'admin@vendorbridge.com', role: 'Admin', name: 'Alok Admin' },
  { uid: 'u-officer', email: 'procurement@vendorbridge.com', role: 'Procurement Officer', name: 'Pradeep Officer' },
  { uid: 'u-manager', email: 'manager@vendorbridge.com', role: 'Manager/Approver', name: 'Manish Manager' },
  { uid: 'u-vendor1', email: 'rajesh@vendorbridge.com', role: 'Vendor', name: 'Rajesh Traders Manager', associatedVendorId: 'vendor-1' },
  { uid: 'u-vendor2', email: 'amit@vendorbridge.com', role: 'Vendor', name: 'Amit Supplies Manager', associatedVendorId: 'vendor-2' },
  { uid: 'u-vendor3', email: 'global@vendorbridge.com', role: 'Vendor', name: 'Global Corp Sales', associatedVendorId: 'vendor-3' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize Auth state
  useEffect(() => {
    if (isFirebaseActive && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Retrieve additional profile data (role, name) from Firestore
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              setUser(profileData);
            } else {
              // Create default profile if not found
              const defaultProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'Vendor',
                name: firebaseUser.email?.split('@')[0] || 'User',
              };
              await setDoc(docRef, defaultProfile);
              setUser(defaultProfile);
            }
          } catch (error) {
            console.error("Error fetching user profile from Firestore:", error);
            // Fallback to local profile
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'Vendor',
              name: 'Firebase User'
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // LocalStorage Auth initialization
      const cached = localStorage.getItem('vendorbridge_current_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (email: string, selectedRole: UserRole): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isFirebaseActive && auth) {
        // Authenticate with Firebase
        const credential = await signInWithEmailAndPassword(auth, email, 'password123'); // Standard password for demo
        const docRef = doc(db, 'users', credential.user.uid);
        const docSnap = await getDoc(docRef);
        
        let profile: UserProfile;
        if (docSnap.exists()) {
          profile = docSnap.data() as UserProfile;
          // Sync requested role if different
          if (profile.role !== selectedRole) {
            profile.role = selectedRole;
            await setDoc(docRef, profile, { merge: true });
          }
        } else {
          profile = {
            uid: credential.user.uid,
            email: credential.user.email || email,
            role: selectedRole,
            name: email.split('@')[0],
          };
          if (selectedRole === 'Vendor') {
            // Check if matches preseeded vendors
            if (email.includes('rajesh')) profile.associatedVendorId = 'vendor-1';
            else if (email.includes('amit')) profile.associatedVendorId = 'vendor-2';
            else if (email.includes('global')) profile.associatedVendorId = 'vendor-3';
          }
          await setDoc(docRef, profile);
        }
        setUser(profile);
        setLoading(false);
        return profile;
      } else {
        // Offline simulation login
        // Check if preseeded user match
        let localUser = LOCAL_USERS_SEED.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!localUser) {
          // Dynamically create the user locally
          localUser = {
            uid: 'u-' + Math.random().toString(36).substr(2, 9),
            email,
            role: selectedRole,
            name: email.split('@')[0],
          };
          if (selectedRole === 'Vendor') {
            if (email.includes('rajesh')) localUser.associatedVendorId = 'vendor-1';
            else if (email.includes('amit')) localUser.associatedVendorId = 'vendor-2';
            else if (email.includes('global')) localUser.associatedVendorId = 'vendor-3';
            else localUser.associatedVendorId = 'vendor-1'; // default link
          }
        } else if (localUser.role !== selectedRole) {
          // Allow switching roles during login for the preseeded accounts
          localUser = { ...localUser, role: selectedRole };
        }

        localStorage.setItem('vendorbridge_current_user', JSON.stringify(localUser));
        setUser(localUser);
        setLoading(false);
        return localUser;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Sign up handler
  const signup = async (email: string, name: string, role: UserRole, vendorId?: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isFirebaseActive && auth) {
        const credential = await createUserWithEmailAndPassword(auth, email, 'password123');
        const profile: UserProfile = {
          uid: credential.user.uid,
          email,
          role,
          name,
          associatedVendorId: role === 'Vendor' ? vendorId : undefined
        };
        await setDoc(doc(db, 'users', credential.user.uid), profile);
        setUser(profile);
        setLoading(false);
        return profile;
      } else {
        const profile: UserProfile = {
          uid: 'u-' + Math.random().toString(36).substr(2, 9),
          email,
          role,
          name,
          associatedVendorId: role === 'Vendor' ? vendorId : undefined
        };
        localStorage.setItem('vendorbridge_current_user', JSON.stringify(profile));
        setUser(profile);
        setLoading(false);
        return profile;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseActive && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('vendorbridge_current_user');
      }
      setUser(null);
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper widget action to switch roles instantly for evaluation/testing
  const switchRoleTesting = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    if (role === 'Vendor' && !updated.associatedVendorId) {
      updated.associatedVendorId = 'vendor-1'; // Default Rajesh Traders for easy vendor testing
    }
    setUser(updated);
    if (!isFirebaseActive) {
      localStorage.setItem('vendorbridge_current_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, switchRoleTesting }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
