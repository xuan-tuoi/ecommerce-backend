export const RoleOfuser = {
  SHOP: 'SHOP',
  USER: 'USER',
  ADMIN: 'ADMIN',
};

export const saltOrRounds = 10;

export const CLOUDINARY = 'Cloudinary';

export const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id',
};

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum Sort {
  CREATED_AT = 'createdAt',
  PRICE = 'price',
  NAME = 'name',
}

export const classifyCategoryByType = [
  {
    category: 'Body',
    type: [
      'Exfoliator',
      'Body Lotion',
      'Bath Salts',
      'Body Wash',
      'Mist',
      'Sun protect',
    ],
  },
  {
    category: 'Hair',
    type: ['Hair'],
  },
  {
    category: 'Facial',
    type: [
      'Moisturiser',
      'Balm',
      'Eye Care',
      'Eye cream',
      'Cleanser',
      'Treatment',
      'Toner',
      'Mask',
      'Oil',
      'Peel',
      'Serum',
      'Face Mask',
    ],
  },
];

export const Order_status = {
  PENDING: 'pending',
  PACKAGED: 'packaged',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};
