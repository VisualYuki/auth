import { beforeEach, describe, expect, it, vi } from "vitest";
import { initDatabase } from "./database/database";
import request from "supertest";
import { app } from "./api/express";
import "./auth/index";
import { type DatabaseSync } from "node:sqlite";
import { hashUtils } from "./utils/hash";
import cookie from "cookie";
import { REFRESH_TOKEN_EXPIRES_IN } from "./utils/token";
import { userCredentialsService } from "./service/user";

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

  it("should return 500 if throws error", async () => {
    const mockIsValidUser = vi
      .spyOn(userCredentialsService, "isValidUser")
      .mockRejectedValue(new Error("Database connection faild"));

    const res = await request(app)
      .post("/auth")
      .send({
        login: "demo",
        password: "demo",
      })
      .expect(500);

    expect(res.body.error).toBe("Database connection faild");

    mockIsValidUser.mockRestore();
  });

  it("401 error if login or password is incorrect", async () => {
    const res = await request(app)
      .post("/auth")
      .send({
        login: "invalid login",
        password: "invalid password",
      })
      .expect(401);

    expect(res.body.data).toBeUndefined();
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

  it("should return error if refresh token isn't set", async () => {
    const res2 = await request(app).post("/auth/refresh").expect(401);

    expect(res2.body.error).toBe("refresh token is required");
  });

  it("should return error if refresh token is invalid", async () => {
    const res2 = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=foo`])
      .expect(401);

    expect(res2.body.error).toBe("refresh token is not exist");
  });

  it("should return error if refresh token is expired", async () => {
    const res1 = await request(app)
      .post("/auth")
      .send({
        login: "login",
        password: "login",
      })
      .expect(200);

    const refreshTokenCookie = res1.headers["set-cookie"][0];

    const refreshToken = cookie.parseCookie(refreshTokenCookie).refreshToken;

    vi.useFakeTimers();

    vi.setSystemTime(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000 + 5000);

    const res2 = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`])
      .expect(401);

    expect(res2.body.error).toBe("refresh token is expired");
  });

  it("should refresh refreshToken after auth", async () => {
    const res1 = await request(app)
      .post("/auth")
      .send({
        login: "login",
        password: "login",
      })
      .expect(200);

    const refreshTokenCookie = res1.headers["set-cookie"][0];

    const refreshToken = cookie.parseCookie(refreshTokenCookie).refreshToken;

    const res2 = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(res2.body.data).toHaveProperty("accessToken");
    expect(res2.body.data.accessToken).toBeTruthy();
  });
});

// describe("/refresh-token", async () => {
//   beforeEach(() => {});

//   it("should refresh refreshToken", async () => {
//     const res = await request(app)
//       .post("/auth/refresh")
//       .set("Cookie", ["nameOne=valueOne;nameTwo=valueTwo"])

//       .expect(200);
//   });
// });

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
