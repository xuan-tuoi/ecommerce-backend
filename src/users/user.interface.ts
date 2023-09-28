export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  password: string;
  email: string;
  status: string;
  avatar: string;
  verify: boolean;
  role: string;
  products: any[];
  reviews: any[];
  cart: any;
  attribute: object;
  isDeleted: boolean;
}
