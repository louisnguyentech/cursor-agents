MODULE_NAME=User

FIELDS:
- email: string, required, unique
- password: string, required
- role: enum[admin,user], default=user
- isActive: boolean, default=true

OPTIONS:
- softDelete: true
- timestamps: true
- pagination: true
- authGuard: jwt
- adminOnlyDelete: true
- indexes: email, role
