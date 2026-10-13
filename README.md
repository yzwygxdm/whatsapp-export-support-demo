# WhatsApp Export Support Agent Demo

A lightweight sales and after-sales assistant demo for export teams. The inbox UI can run as a static preview, or connect to a small Node.js agent service that calls an OpenAI-compatible chat model. The agent can classify a request, collect quote/sample details, create demo lead or support records, and flag conversations for a human.

## Run the agent locally

1. Install Node.js 18 or later.
2. Copy `.env.example` to `.env`.
3. Leave `OPENAI_API_KEY` blank for the safe demo mode, or add a model API key to enable live AI. `OPENAI_MODEL` and `OPENAI_CHAT_COMPLETIONS_URL` can be changed for a compatible provider.
4. Run `node server.js` and open `http://localhost:4174`.

The API key stays on the server and is never sent to the browser. In demo mode, the agent uses a small fallback intent router. With a key configured, the model receives a minimal sample catalog and policy prompt, and must return an allowlisted action. Model outputs can create only local demo records; they do not contact customers, look up real orders, or write to a CRM.

## Try the workflows

- Use **Price enquiry**, **Delivery issue**, and **Sample request** to exercise the agent.
- Send a free-text message and see the reply, intent, and demo action.
- **Take over conversation** pauses automated replies. The agent can also flag a handoff for a teammate.
- Product facts and policies are illustrative. Add client-approved product, pricing, shipping, and warranty data before using the assistant for real advice.

## Static preview

The GitHub Pages workflow deploys the interface. GitHub Pages cannot run the Node agent server, so its chat uses the built-in rule-based fallback. For live AI, deploy `server.js` to a trusted backend, set `FRONTEND_ORIGIN` to the Pages site origin, and set the `agent-api-base` meta tag in `index.html` to that backend's base URL.

## Production integration

This is not connected to WhatsApp or a CRM. A production rollout still needs the WhatsApp Business Platform/Cloud API or an approved provider, inbound webhooks, persistent conversations and tickets, order/CRM tools, approved outbound templates, opt-in tracking, and a human review path. Keep secrets on the backend, verify WhatsApp webhook signatures, and never let the model invent prices or claim an order action succeeded.
