# WhatsApp Export Support Demo

A reusable, browser-only prototype for an export sales and after-sales WhatsApp assistant. It includes a simulated team inbox, English customer conversations, lead capture, support triage, and an AI-to-human handoff.

## Preview

Open `index.html` in a modern browser. No build step, account, or API key is needed.

Try the **Price enquiry**, **Delivery issue**, and **Sample request** scenario buttons below the conversation. Type a message in the composer, search the conversation list, or use **Take over conversation** to pause the demo bot and reply as an agent.

## What is simulated

- All contacts, products, messages, order details, and times are sample data.
- The chat replies use small browser-side rules; there is no language model or WhatsApp connection.
- Lead capture, ticket creation, order lookup, and agent assignment are visual demonstrations. They do not save to a CRM or notify a real team.

## Adapt it for a client

Replace the sample company and product content in `index.html`. Update the sample workflows in `app.js`, and tune the visual identity in `styles.css`. Keep product facts, approved pricing, shipping terms, warranty rules, and escalation contacts in client-owned settings or a connected knowledge base before using real customer conversations.

For production, connect the WhatsApp Business Platform through a provider or Cloud API, receive inbound messages through a webhook, persist conversations and tickets, and connect the team's CRM or order system. Add approved message templates and permission tracking for business-initiated messages. Keep the service-window rules and a clear human escalation path in the send workflow.

## Publish with GitHub Pages

The included workflow deploys this static demo to GitHub Pages whenever changes reach the `main` branch. In the repository, choose **Settings → Pages → Build and deployment → Source: GitHub Actions** if Pages is not enabled automatically. The deployment URL will appear in the workflow run summary.

This prototype is for product discussion and workflow review. It is not a live WhatsApp bot.
