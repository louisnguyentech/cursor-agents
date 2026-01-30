INPUT:
- MODULE=<module-name>

BEHAVIOR:
- Load schema from .ai/schemas/<MODULE>.schema.md
- If file not found, STOP

TARGET:
- src/modules/<MODULE>

RULES:
- Create real files
- Use NestJS + Mongoose
- Generate:
  - Schema
  - DTOs
  - Service CRUD
  - Controller REST
- Apply validation, swagger, guards, indexes
- No explanation
