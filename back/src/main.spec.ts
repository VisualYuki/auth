import { beforeEach, describe, expect, it } from "vitest";
import { initDatabase } from "./database/database";
import request from "supertest";
import { app } from "./express";
import "./auth/index";
import { type DatabaseSync } from "node:sqlite";
import { hashUtils } from "./utils/hash";

let db: DatabaseSync;

describe("/auth", () => {
  beforeEach(async () => {
    db = await initDatabase(true);

    db.exec(`
      CREATE TABLE users (
        login TEXT NOT NULL PRIMARY KEY,
        password TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE refreshSessions (
        "userLogin"	TEXT NOT NULL UNIQUE,
        "refreshToken" TEXT NOT NULL,
        "expiresAt"	INTEGER
      )
    `);

    db.prepare(`INSERT INTO users (login, password) VALUES (?,?)`).run(
      "demo",
      await hashUtils.hash("demo")
    );

    db.prepare(`INSERT INTO users (login, password) VALUES (?,?)`).run(
      "login",
      await hashUtils.hash("login")
    );
  });

  it("200 response with accessToken payload and refreshToken cookie", async () => {
    const res = await request(app)
      .post("/auth")
      .send({
        login: "demo",
        password: "demo",
      })
      .expect(200);

    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.accessToken).toBeTruthy();

    const refreshTokenCookie = res.headers["set-cookie"][0];

    expect(refreshTokenCookie).toContain("refreshToken=");
    expect(refreshTokenCookie).toContain("HttpOnly");
  });

  it("401 error if login or password is incorrect", async () => {
    const res = await request(app)
      .post("/auth")
      .send({
        login: "invalid login",
        password: "invalid password",
      })
      .expect(401);

    expect(res.body.data).not.toHaveProperty("accessToken");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("400 error if password is empty", async () => {
    const res = await request(app)
      .post("/auth")
      .send({
        login: "demo",
        password: "",
      })
      .expect(400);

    expect(res.body.error).toBe("login and password are required");
  });

  it("refresh token is stored in database", async () => {
    const res = await request(app)
      .post("/auth")
      .send({
        login: "login",
        password: "login",
      })
      .expect(200);

    const bdRow = db
      .prepare(`SELECT * FROM refreshSessions WHERE userLogin = ?`)
      .all("login");

    expect(bdRow.length).toBe(1);
  });
});

// describe("/protected", () => {
//   let accessToken: string;

//   beforeEach(async () => {
//     initDatabase();

//     const res = await request(app).post("/auth").send({
//       login: "demo",
//       password: "demo",
//     });

//     accessToken = res.body.accessToken;
//   });

//   it("should return data", async () => {
//     const res = await request(app)
//       .post("/protected")
//       .set("authorization", accessToken);

//     expect(res.body.message).toBe("message from protected");
//   });

//   it("accessToken is invalid after timeout", async () => {
//     await setTimeout(() => {}, 30);

//     const res = await request(app)
//       .post("/protected")
//       .set("authorization", accessToken);
//   });
// });
