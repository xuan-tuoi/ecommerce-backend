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

const listImgProduct = [
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057510/ecommerce/products/1695057463913.png',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057680/ecommerce/products/1695057633859.png',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057679/ecommerce/products/1695057633929.webp',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057679/ecommerce/products/1695057633931.jpg',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057679/ecommerce/products/1695057633933.webp',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057679/ecommerce/products/1695057633936.webp',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057680/ecommerce/products/1695057633938.png',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057680/ecommerce/products/1695057633941.png',
  'http://res.cloudinary.com/dyhgehoxx/image/upload/v1695057680/ecommerce/products/1695057633942.png',
];
