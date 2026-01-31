
const AUTH_DB_NAME = 'PiggyAuthDB';
const USERS_STORE = 'users';
const SESSION_KEY = 'piggy_session';

const getAuthDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUTH_DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: 'username' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

const hashPassword = async (password: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const authService = {
  async signUp(username: string, password: string): Promise<{ success: boolean; message: string }> {
    const db = await getAuthDB();
    const userExists = await this.getUser(username);
    if (userExists) return { success: false, message: 'Username already taken!' };

    const hashedPassword = await hashPassword(password);
    return new Promise((resolve) => {
      const transaction = db.transaction(USERS_STORE, 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.add({ username, password: hashedPassword, badges: [] });
      request.onsuccess = () => resolve({ success: true, message: 'Welcome to the family!' });
      request.onerror = () => resolve({ success: false, message: 'Signup failed. Try again!' });
    });
  },

  async logIn(username: string, password: string): Promise<{ success: boolean; user?: any; message: string }> {
    const user = await this.getUser(username);
    if (!user) return { success: false, message: 'User not found!' };

    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) return { success: false, message: 'Wrong password!' };

    localStorage.setItem(SESSION_KEY, username);
    return { success: true, user, message: 'Welcome back!' };
  },

  async getUser(username: string): Promise<any> {
    const db = await getAuthDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(USERS_STORE, 'readonly');
      const store = transaction.objectStore(USERS_STORE);
      const request = store.get(username);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  },

  async saveBadge(username: string, badge: any): Promise<void> {
    const db = await getAuthDB();
    const user = await this.getUser(username);
    if (user) {
      user.badges = [...(user.badges || []), badge];
      const transaction = db.transaction(USERS_STORE, 'readwrite');
      const store = transaction.objectStore(USERS_STORE);
      store.put(user);
    }
  },

  getSession(): string | null {
    return localStorage.getItem(SESSION_KEY);
  },

  logOut(): void {
    localStorage.removeItem(SESSION_KEY);
  }
};
