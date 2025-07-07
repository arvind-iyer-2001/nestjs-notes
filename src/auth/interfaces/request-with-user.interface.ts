import { Request } from 'express';

export interface User {
  id: number;
  email: string;
  name: string | null;
}

export interface RequestWithUser extends Request {
  user: User;
}
