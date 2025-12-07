import { userDatabase } from "../database/user";
import { hashUtils } from "../utils/hash";

async function isValidUser(login: string, password: string) {
  const user = userDatabase.getUserByLogin(login);

  if (!user) {
    return false;
  }

  const isValidPassword = await hashUtils.compare(
    password,
    user.password as string
  );

  if (!isValidPassword) {
    return false;
  }

  return true;
}

export const userCredentialsService = {
  isValidUser,
};
