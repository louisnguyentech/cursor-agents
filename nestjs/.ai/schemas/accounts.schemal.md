MODULE_NAME=User

FIELDS:
- email: string, required, unique
- password: string, required
- role: enum[admin,user], default=user
- isActive: boolean, default=true
- refreshToken: string, optional (hashed, for rotation/revocation)
- refreshTokenExpiresAt: Date, optional

TOKENS:
- access_token: JWT, short-lived (e.g. 15m), issued on login/signup, not persisted
- refresh_token: issued on login, stored hashed in refreshToken, longer expiry (e.g. 7d); use to obtain new access_token via refresh endpoint

OPTIONS:
- softDelete: true
- timestamps: true
- pagination: true
- authGuard: jwt
- adminOnlyDelete: true
- indexes: email, role
