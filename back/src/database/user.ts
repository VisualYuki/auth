import { db } from "./database";

function getUserByLogin(login: string) {
  return db.prepare("select * from users where login = ?").get(login);
}

export const userDatabase = {
  getUserByLogin,
};
