import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

export const authRequired = (
  req,
  res,
  next
) => {
  try {
    // ==========================================
    // 1. BUSCAR TOKEN EN COOKIE
    // ==========================================

    let token = req.cookies?.token;

    // ==========================================
    // 2. SI NO HAY COOKIE, BUSCAR BEARER TOKEN
    // ==========================================

    if (!token) {
      const authorization =
        req.headers.authorization;

      if (
        authorization &&
        authorization.startsWith("Bearer ")
      ) {
        token = authorization.split(" ")[1];
      }
    }

    // ==========================================
    // 3. SI NO EXISTE TOKEN
    // ==========================================

    if (!token) {
      return res.status(401).json({
        message:
          "No token, authorization denied",
      });
    }

    // ==========================================
    // 4. VERIFICAR JWT
    // ==========================================

    jwt.verify(
      token,
      TOKEN_SECRET,
      (error, user) => {
        if (error) {
          return res.status(403).json({
            message:
              "Invalid or expired token",
          });
        }

        // Guardamos los datos del JWT
        req.user = user;

        // Continuamos a la ruta
        next();
      }
    );
  } catch (error) {
    console.error(
      "Error verificando token:",
      error
    );

    return res.status(500).json({
      message:
        "Error verificando autenticación",
    });
  }
};
