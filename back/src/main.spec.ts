import { beforeEach, describe, expect, it } from "vitest";
import { initDatabase } from "./database/database";
import request from "supertest";
import { app } from "./express";
import "./auth/index";

describe("/auth", () => {
  beforeEach(() => {
    initDatabase();
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
