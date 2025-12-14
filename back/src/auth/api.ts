import { NextFunction, Request, Response } from "express";
import { app } from "../api/express";
import { tokenService } from "../service/token";
import { userCredentialsService } from "../service/user";
import { Payload, tokenUtils } from "../utils/token";
import { tokenDatabase } from "../database/token";

function createResponse(param: {
  data?: Record<string, unknown>;
  error?: string;
}) {
  const response: { data?: Record<string, unknown>; error?: string } = {};

  if (param.data) {
    response.data = param.data;
  }

  if (param.error) {
    response.error = param.error;
  }

  return response;
}

app.post(
  "/auth",
  async (
    req: Request<{}, any, { login: string; password: string }>,
    res,
    next
  ) => {
    try {
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

        return res.json(
          createResponse({
            data: {
              accessToken: accessToken,
            },
          })
        );
      } else {
        return res.status(401).json(
          createResponse({
            error: "invalid auth data",
          })
        );
      }
    } catch (err) {
      next(err);
    }
  }
);

app.post("/auth/refresh", async (req: Request<{}, any, any>, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken)
      return res
        .status(401)
        .json(createResponse({ error: "refresh token is required" }));

    const refreshSession = tokenDatabase.getRefreshSession(refreshToken);

    if (!refreshSession) {
      return res
        .status(401)
        .json(createResponse({ error: "refresh token is not exist" }));
    }

    if (tokenService.isRefreshTokenExpired(refreshToken)) {
      return res
        .status(401)
        .json(createResponse({ error: "refresh token is expired" }));
    }

    const accessToken = tokenService.generateAccessToken({
      login: refreshSession.userLogin,
    });

    return res.json(
      createResponse({
        data: {
          accessToken: accessToken,
        },
      })
    );
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    return res.status(500).json(createResponse({ error: err.message }));
  } else if (typeof err === "string") {
    return res.status(500).json(createResponse({ error: err }));
  }

  return res
    .status(500)
    .json(createResponse({ error: "Internal server error" }));
});

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
