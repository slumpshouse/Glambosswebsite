# Graduation Requirements

## TS Competencies

-  TS.3.1 - Consume Application Programming Interfaces
	- Stripe PaymentIntent API call in backend: [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L58)
	- OpenAI Chat Completions API call: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L88)
	- Frontend consuming internal API routes with `fetch`: [app/admin/ai-summary/page.jsx](app/admin/ai-summary/page.jsx#L18)

-  TS.3.2 - Handle Web Servers
	- Server route handler for payment intents (`POST`): [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L17)
	- Server route handlers for weekly summaries (`GET`, `POST`, `PUT`): [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L110)
	- HTTP JSON responses and status code handling: [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L91)

-  TS.5.3 - Work in a Collaborative Development Environment
	- Shared linting standards via ESLint config: [eslint.config.mjs](eslint.config.mjs#L1)
	- Team test workflow via Vitest script: [package.json](package.json#L11)
	- Automated hook setup for consistent commits: [package.json](package.json#L13)
	- Existing test suite for multiple features: [__tests__/weekly-summary-endpoint.test.js](__tests__/weekly-summary-endpoint.test.js)
	- Git hooks directory present for team automation: [.githooks/pre-commit](.githooks/pre-commit)

- TS.6.1 - Prompt Effectively
	- Structured prompt with role, output shape, and rules: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L74)
	- Explicit system + user message design: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L92)

-  TS.6.3 - Integrate AI Tools
	- OpenAI SDK dependency included: [package.json](package.json#L24)
	- OpenAI client initialized and used in production route: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L66)
	- Admin UI trigger to generate AI summaries: [app/admin/ai-summary/page.jsx](app/admin/ai-summary/page.jsx#L49)

- +++++++ TS.6.4 - Customize AI Models
	- Model selection configured (`gpt-4o-mini`): [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L89)
	- Inference behavior tuned (`temperature: 0.2`): [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L90)
	- Output format constrained to JSON object: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L91)
	- Runtime output validated against Zod schema: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L7)

