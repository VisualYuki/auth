import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync;

export async function initDatabase() {
  db = new DatabaseSync("./database.db");

  return db;
}

type UserCredentials = { login: string; password: string };

export const dbService = {
  getUserCredentials(login: string, password: string) {
    return db
      .prepare("select * from auth where login = ? and password = ?")
      .get(login, password);
  },

  getRefreshToken(token: string) {
    return db
      .prepare("select * from refreshSessions where token = ?")
      .get(token);
  },

  // TODO: для логина может быть несколько refresh токенов
  addRefreshToken(userLogin: string, refreshToken: string, expiresAt: number) {
    this.removeRefreshToken(userLogin);

    db.prepare(
      "insert into refreshSessions (userLogin, refreshToken, expiresAt) values (?, ?, ?)"
    ).run(userLogin, refreshToken, expiresAt);
  },

  removeRefreshToken(userLogin: string) {
    db.prepare("delete from refreshSessions where userLogin = ?").run(
      userLogin
    );
  },
};
