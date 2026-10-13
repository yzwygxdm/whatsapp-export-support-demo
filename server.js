const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const root = __dirname;
const port = Number(process.env.PORT || 4174);
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const endpoint = process.env.OPENAI_CHAT_COMPLETIONS_URL || 'https://api.openai.com/v1/chat/completions';
const frontendOrigin = process.env.FRONTEND_ORIGIN;

const knowledge = `You are Northstar Trading's export sales and after-sales assistant. Be concise, warm, and use the customer's language. Only state facts present here; never invent prices, stock, shipping dates, order status, warranties, or policy. If a fact is missing, ask one focused question or offer a human handoff.\n\nSAMPLE CATALOG (demo only): Insulated stainless steel bottle, 500 ml and 750 ml; logo and color customization may be available but require sales confirmation. No approved price list is configured.\nSAMPLE POLICIES (demo only): Bulk quote requires product, quantity, destination country, and optional customization. Samples require product, quantity, and destination. For delivery, refunds, damaged goods, payment disputes, complaints, or requests for a person, collect only the minimum useful details and escalate to a human. Never ask for passwords, full payment-card details, or identity documents.\n\nReturn one JSON object only: {"reply":"message to customer","intent":"product|quote|sample|shipping|after_sales|other","action":"answer|capture_lead|create_support_ticket|handoff","captured":{"product":"","quantity":"","destination":"","order_number":"","issue":""}}. Use empty strings for unknown fields. Use capture_lead only for a quote/sample request; create_support_ticket for an order or after-sales issue; handoff whenever a human is requested or the situation needs judgment. Do not claim an external order, ticket, or CRM action happened; these actions are demo records.`;

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const reply = (res, status, data, origin) => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (frontendOrigin && origin === frontendOrigin) headers['access-control-allow-origin'] = frontendOrigin;
  res.writeHead(status, headers); res.end(JSON.stringify(data));
};

function parseModelJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch {}
  return null;
}

function safeFallback(messages) {
  const text = String(messages.at(-1)?.content || '').toLowerCase();
  if (/(human|person|agent|客服|人工|complaint|refund|damaged|broken|payment|chargeback|退款|损坏|投诉)/.test(text)) {
    return { reply: 'I’m sorry you’re dealing with this. I’ve flagged the conversation for our team. Please share your order number and a short description; a teammate will review it.', intent: 'after_sales', action: 'handoff', captured: { issue: text.slice(0, 240) } };
  }
  if (/(price|quote|cost|报价|价格|多少钱)/.test(text)) return { reply: 'I can prepare a quote request. Which product and quantity do you need, and which country should we ship to? Pricing and lead time need confirmation from our sales team.', intent: 'quote', action: 'capture_lead', captured: {} };
  if (/(ship|delivery|tracking|order|late|物流|订单|发货)/.test(text)) return { reply: 'I can help route this to support. Please share your order number and a brief description. Our team will verify the latest status.', intent: 'shipping', action: 'create_support_ticket', captured: {} };
  if (/(sample|samples|样品)/.test(text)) return { reply: 'We can help with a sample request. Which product and quantity would you like, and where should we send it? Our team will confirm availability and shipping.', intent: 'sample', action: 'capture_lead', captured: {} };
  return { reply: 'I can help with product details, a quote, samples, or an order issue. What would you like to know?', intent: 'other', action: 'answer', captured: {} };
}

function executeDemoAction(agentResult) {
  const recordId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  if (agentResult.action === 'capture_lead') return { ...agentResult, record: { type: 'sales_lead', id: recordId, status: 'awaiting_team_confirmation' } };
  if (agentResult.action === 'create_support_ticket') return { ...agentResult, record: { type: 'support_case', id: recordId, status: 'awaiting_human_review' } };
  if (agentResult.action === 'handoff') return { ...agentResult, record: { type: 'human_handoff', id: recordId, status: 'needs_agent' } };
  return agentResult;
}

async function runAgent(messages) {
  const safeMessages = messages.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }));
  if (!safeMessages.length || safeMessages.at(-1).role !== 'user') throw new Error('A customer message is required.');
  if (!apiKey) return executeDemoAction(safeFallback(safeMessages));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: knowledge }, ...safeMessages] }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Model request failed (${response.status}).`);
  const payload = await response.json();
  const result = parseModelJson(payload.choices?.[0]?.message?.content || '');
  if (!result || typeof result.reply !== 'string') throw new Error('The model returned an invalid agent response.');
  const actions = new Set(['answer', 'capture_lead', 'create_support_ticket', 'handoff']);
  if (!actions.has(result.action)) result.action = 'handoff';
  result.intent = String(result.intent || 'other').slice(0, 40);
  result.captured = Object.fromEntries(['product', 'quantity', 'destination', 'order_number', 'issue'].map((key) => [key, String(result.captured?.[key] || '').slice(0, 240)]));
  result.reply = result.reply.slice(0, 1200);
  return executeDemoAction(result);
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}` && origin !== `https://${req.headers.host}` && origin !== frontendOrigin) return reply(res, 403, { error: 'Origin not allowed.' }, origin);
  if (req.method === 'OPTIONS') {
    if (!frontendOrigin || origin !== frontendOrigin) return reply(res, 403, { error: 'Origin not allowed.' }, origin);
    res.writeHead(204, { 'access-control-allow-origin': frontendOrigin, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' }); return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && req.method === 'GET') return reply(res, 200, { mode: apiKey ? 'ai' : 'demo', model: apiKey ? model : null }, origin);
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 32_000) req.destroy(); });
    req.on('end', async () => {
      try { const data = JSON.parse(body || '{}'); return reply(res, 200, { mode: apiKey ? 'ai' : 'demo', ...(await runAgent(Array.isArray(data.messages) ? data.messages : [])) }, origin); }
      catch (error) { return reply(res, 502, { error: error.message || 'Agent request failed.' }, origin); }
    });
    return;
  }
  if (url.pathname.startsWith('/api/')) return reply(res, 404, { error: 'Not found' }, origin);
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => console.log(`Export Support Agent demo listening on http://localhost:${port} (${apiKey ? `AI: ${model}` : 'demo mode'})`));
