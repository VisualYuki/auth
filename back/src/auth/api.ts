import { Request } from "express";
import { app } from "../express";
import { tokenService } from "../service/token";
import { userCredentialsService } from "../service/user";
import { Payload } from "../utils/token";

function createResponse(param: {
  data?: Record<string, unknown>;
  error?: string | null;
}) {
  return {
    data: param.data ? param.data : {},
    error: param.error ? param.error : "",
  };
}

app.post(
  "/auth",
  async (req: Request<{}, any, { login: string; password: string }>, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json(
        createResponse({
          error: "login and password are required",
        })
      );
    }

    const isValidUser = await userCredentialsService.isValidUser(
      login,
      password
    );

    if (isValidUser) {
      const payload: Payload = {
        login,
      };

      const accessToken = tokenService.generateAccessToken(payload);
      const refreshToken = tokenService.generateRefreshToken(payload);

      res.cookie("refreshToken", refreshToken.token, {
        httpOnly: true,
        //maxAge: 1000,
      });

      res.json(
        createResponse({
          data: {
            accessToken: accessToken,
          },
        })
      );
    } else {
      res.status(401).json(
        createResponse({
          error: "invalid auth data",
        })
      );
    }
  }
);

// app.post("/auth/refresh", async (req: Request<{}, any, any>, res) => {
//   const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken)
//     return res.status(401).json({ message: "refresh token is required" });
//   if (!(await getRefreshToken(refreshToken)))
//     return res.status(403).json({ message: "refresh token is invalid" });

//   jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
//     if (err)
//       return res.status(403).json({ message: "refresh token is invalid" });

//     const payload: Payload = { login: (decoded as Payload).login };
//     const newToken = generateAccessToken(payload);

//     res.json({ token: newToken });
//   });
// });

// app.post(
//   "/protected",
//   (req, res, next) => {
//     const token = req.headers["authorization"];

//     if (!token) {
//       res.status(401);
//       return;
//     }

//     jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
//       if (err) {
//         res.status(403);
//         return;
//       }

//       //@ts-ignore
//       req.user = decoded;
//       next();
//     });
//   },
//   (req, res) => {
//     //@ts-ignore
//     res.json({ message: "message from protected", user: req.user });
//   }
// );

// app.post("/auth/logout", (req, res) => {
//   debugger;

//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Origin", "http://localhost:1866"); // конкретный домен, не *

//   const refreshToken = req.cookies.refreshToken;

//   removeRefreshToken(refreshToken);

//   req.status(204);
// });
