export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborator' | 'partner';
  clientId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
