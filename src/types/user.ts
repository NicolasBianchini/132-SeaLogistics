export interface userForm {
  email: string;
  password: string;
}

export interface userCredentials {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
}

export interface UserSettings {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  notifications: {
    email: boolean;
    push: boolean;
    statusUpdates: boolean;
    newShipments: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
    theme: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
