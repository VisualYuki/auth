import { db } from "./database";

function addRefreshToken(
  userLogin: string,
  refreshToken: string,
  expiresAt: number
) {
  removeRefreshToken(userLogin);

  db.prepare(
    "insert into refreshSessions (userLogin, refreshToken, expiresAt) values (?, ?, ?)"
  ).run(userLogin, refreshToken, expiresAt);
}

function removeRefreshToken(userLogin: string) {
  db.prepare("delete from refreshSessions where userLogin = ?").run(userLogin);
}

export interface RefreshSession {
  userLogin: string;
  refreshToken: string;
  expiresAt: number | null;
}

function getRefreshSession(token: string) {
  return db
    .prepare("select * from refreshSessions where refreshToken = ?")
    .get(token) as RefreshSession | undefined;
}

export const tokenDatabase = {
  addRefreshToken,
  removeRefreshToken,
  getRefreshSession,
};
