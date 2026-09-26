import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";

// ============================================================
// CONFIGURACIÓN DE COOKIE
// ============================================================
// La conservamos por compatibilidad, aunque para las peticiones
// protegidas utilizaremos principalmente Authorization: Bearer TOKEN.
// ============================================================

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

// ============================================================
// REGISTRAR USUARIO
// ============================================================

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // --------------------------------------------------------
    // Validación básica
    // --------------------------------------------------------

    if (!username || !email || !password) {
      return res.status(400).json({
        message: [
          "Username, email and password are required",
        ],
      });
    }

    // --------------------------------------------------------
    // Comprobar si ya existe el correo
    // --------------------------------------------------------

    const userFound = await User.findOne({
      email,
    });

    if (userFound) {
      return res.status(400).json({
        message: [
          "The email is already in use",
        ],
      });
    }

    // --------------------------------------------------------
    // Cifrar contraseña
    // --------------------------------------------------------

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    // --------------------------------------------------------
    // Crear usuario
    // --------------------------------------------------------

    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    // --------------------------------------------------------
    // Guardar usuario en MongoDB
    // --------------------------------------------------------

    const userSaved = await newUser.save();

    // --------------------------------------------------------
    // Crear JWT
    // --------------------------------------------------------

    const token = await createAccessToken({
      id: userSaved._id,
      username: userSaved.username,
    });

    // --------------------------------------------------------
    // Guardar también JWT en cookie
    // --------------------------------------------------------

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    console.log(
      "Usuario registrado correctamente:",
      userSaved.email
    );

    // --------------------------------------------------------
    // IMPORTANTE:
    // También enviamos token al frontend.
    //
    // AuthContext lo guardará en localStorage.
    // --------------------------------------------------------

    return res.status(201).json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,

      // MUY IMPORTANTE
      token,
    });

  } catch (error) {
    console.error(
      "Error en register:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Error registering user",
    });
  }
};

// ============================================================
// INICIAR SESIÓN
// ============================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --------------------------------------------------------
    // Validar datos
    // --------------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        message: [
          "Email and password are required",
        ],
      });
    }

    // --------------------------------------------------------
    // Buscar usuario
    // --------------------------------------------------------

    const userFound = await User.findOne({
      email,
    });

    if (!userFound) {
      return res.status(400).json({
        message: [
          "The email does not exist",
        ],
      });
    }

    // --------------------------------------------------------
    // Comparar contraseña
    // --------------------------------------------------------

    const isMatch = await bcrypt.compare(
      password,
      userFound.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: [
          "The password is incorrect",
        ],
      });
    }

    // --------------------------------------------------------
    // Crear JWT
    // --------------------------------------------------------

    const token = await createAccessToken({
      id: userFound._id,
      username: userFound.username,
    });

    // --------------------------------------------------------
    // Mantener cookie por compatibilidad
    // --------------------------------------------------------

    res.cookie(
      "token",
      token,
      cookieOptions
    );

    console.log(
      "Login correcto:",
      userFound.email
    );

    // --------------------------------------------------------
    // MUY IMPORTANTE:
    //
    // Devolvemos token al frontend.
    //
    // AuthContext hará:
    //
    // localStorage.setItem("token", res.data.token)
    // --------------------------------------------------------

    return res.status(200).json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,

      // MUY IMPORTANTE
      token,
    });

  } catch (error) {
    console.error(
      "Error en login:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Error logging in",
    });
  }
};

// ============================================================
// OBTENER PERFIL
// ============================================================

export const profile = async (req, res) => {
  try {

    /*
     * authRequired ya verificó el JWT.
     *
     * Por eso tenemos disponible:
     *
     * req.user.id
     */

    const userFound =
      await User.findById(
        req.user.id
      );

    if (!userFound) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt,
    });

  } catch (error) {
    console.error(
      "Error obteniendo perfil:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Error getting profile",
    });
  }
};

// ============================================================
// CERRAR SESIÓN
// ============================================================

export const logout = async (req, res) => {
  try {

    /*
     * Eliminamos la cookie del backend.
     *
     * El token de localStorage será eliminado
     * por AuthContext en el frontend.
     */

    res.clearCookie(
      "token",
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      }
    );

    console.log(
      "Sesión cerrada correctamente"
    );

    return res.sendStatus(200);

  } catch (error) {
    console.error(
      "Error cerrando sesión:",
      error
    );

    return res.status(500).json({
      message:
        "Error closing session",
    });
  }
};

// ============================================================
// VERIFICAR SESIÓN
// ============================================================

export const verifyToken = async (
  req,
  res
) => {
  try {

    /*
     * IMPORTANTE:
     *
     * Esta función YA NO busca directamente:
     *
     * req.cookies.token
     *
     * porque authRequired se encargará de buscar:
     *
     * 1. Cookie token
     *
     * o
     *
     * 2. Authorization: Bearer TOKEN
     *
     * Después de verificar el JWT,
     * authRequired guarda los datos en:
     *
     * req.user
     */

    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Buscar usuario en MongoDB
    // --------------------------------------------------------

    const userFound =
      await User.findById(
        req.user.id
      );

    if (!userFound) {
      return res.status(401).json({
        message:
          "User not found",
      });
    }

    // --------------------------------------------------------
    // Sesión válida
    // --------------------------------------------------------

    return res.status(200).json({
      id: userFound._id,
      username:
        userFound.username,
      email:
        userFound.email,
    });

  } catch (error) {
    console.error(
      "Error verificando usuario:",
      error
    );

    return res.status(500).json({
      message:
        "Error verifying authentication",
    });
  }
};
