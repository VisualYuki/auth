import { db } from "./database";

// TODO: для логина может быть несколько refresh токенов
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

export const tokenDatabase = {
  addRefreshToken,
  removeRefreshToken,
};

// getRefreshToken(token: string) {
// 	return db
// 	  .prepare("select * from refreshSessions where token = ?")
// 	  .get(token);
//  },
