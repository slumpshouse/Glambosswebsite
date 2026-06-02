# Graduation Requirements

## TS Competencies

- TS.1.2 - Understand statements
	- Simple explanation: statements are the individual instructions that store values, call functions, and send responses.
	- Evidence: [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L21), [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L22), [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L89)
	- Example in your app: the payment intent route reads request data, converts values, and returns JSON responses.

- TS.1.3 - Utilize conditionals
	- Simple explanation: conditionals let the app make decisions with `if` and `else` logic.
	- Evidence: [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L26), [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L62), [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L99)
	- Example in your app: in [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L113), the app checks `if (sale.paymentStatus === "paid")` and immediately returns an already-paid response. In the same file, it also uses conditionals to block unauthorized access and to decide whether a new Stripe PaymentIntent should be created or reused.

- TS.1.4 - Optimize statements
	- Simple explanation: optimized statements are shorter or more efficient ways to write code so it runs cleaner and avoids repeated work.
	- Evidence: [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L120), [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L26), [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L45)
	- Example in your app: in [app/api/sales/weekly-summary/route.js](app/api/sales/weekly-summary/route.js#L120), the app uses `Promise.all` to load the weekly sales aggregate and the latest saved summary at the same time, which is faster than waiting for each query one by one. In [app/api/payments/create-intent/route.js](app/api/payments/create-intent/route.js#L45), it uses `??` to quickly choose the primary unpaid sale or fall back to the first unpaid sale.

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

