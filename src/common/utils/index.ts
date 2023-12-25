import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as _ from 'lodash';
import moment from 'moment';

export const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

export const generateKeyByCrypto = async () => {
  const iv = randomBytes(16);
  const password = 'Password used to generate key';

  // The key length is dependent on the algorithm.
  // In this case for aes256, it is 32 bytes.
  const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
  const cipher = createCipheriv('aes-256-ctr', key, iv);

  const textToEncrypt = 'Nest';
  const encryptedText = Buffer.concat([
    cipher.update(textToEncrypt),
    cipher.final(),
  ]);

  return {
    iv: iv.toString('hex'),
    encryptedData: encryptedText.toString('hex'),
  };
};

export const mappingCategory = (category: string) => {
  const mapStr = category.split('_').join(' ');
  return mapStr.charAt(0).toUpperCase() + mapStr.slice(1);
};

function generateRandomTimeBetween(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = end - start;

  const randomMilliseconds = Math.floor(Math.random() * diff);
  const resultTime = new Date(start + randomMilliseconds);

  return resultTime.toISOString().slice(0, 19).replace('T', ' ');
}

export function generateTimeList(startDate, endDate, count) {
  const timeList = [];
  for (let i = 0; i < count; i++) {
    const randomTime = generateRandomTimeBetween(startDate, endDate);
    timeList.push(randomTime);
  }
  return timeList;
}
