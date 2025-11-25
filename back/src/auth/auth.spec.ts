import { beforeEach, describe, expect, it } from "vitest";
import { initDatabase } from "../database";
import request from "supertest";
import { app } from "../express";
import "./index";

describe("/auth", () => {
  beforeEach(() => {
    initDatabase();
  });

  it("get accessToken and refreshToken", async () => {
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

  it("invalid login and password", async () => {
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
