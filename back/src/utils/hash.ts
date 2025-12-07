import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const hash = (str: string) => {
  return bcrypt.hash(str, SALT_ROUNDS);
};

const compare = (str: string, hash: string) => {
  return bcrypt.compare(str, hash);
};

export const hashUtils = {
  hash,
  compare,
};
