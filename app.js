const $ = (selector) => document.querySelector(selector);
const messages = $('#messages');
const input = $('#messageInput');
const toast = $('#toast');
let toastTimer;
let isHuman = false;
let activeScenario = 'price';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function addMessage(text, type, name = null) {
  const row = document.createElement('div');
  row.className = `message-row ${type}`;
  const isIncoming = type === 'incoming';
  const avatar = isIncoming
    ? `<span class="mini-avatar ${$('#headerAvatar').className.split(' ').at(-1)}">${$('#headerAvatar').textContent}</span>`
    : `<span class="bot-avatar">${isHuman ? 'JL' : '✦'}</span>`;
  const sender = isIncoming ? ($('#chatName').textContent) : (isHuman ? 'Jamie Lee' : 'Harbor AI <span class="ai-tiny">✦ AI</span>');
  const content = document.createElement('div');
  content.className = 'message-content';
  const senderEl = document.createElement('span');
  senderEl.className = 'sender';
  if (isIncoming) senderEl.textContent = sender;
  else senderEl.innerHTML = sender;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  content.append(senderEl, bubble, time);
  row.innerHTML = avatar;
  row.append(content);
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function botReply(text) {
  const lower = text.toLowerCase();
  if (/(price|quote|cost|报价|价格|多少钱)/.test(lower)) {
    activeScenario = 'price';
    return 'Happy to prepare a quote. What product and quantity do you have in mind, and which country should we ship to?';
  }
  if (/(ship|delivery|tracking|order|late|物流|订单|发货)/.test(lower)) {
    activeScenario = 'shipping';
    return 'I can help check on that. Please share your order number and the email or phone number used at checkout. I’ll pass this to our support team for a verified update.';
  }
  if (/(sample|samples|样品)/.test(lower)) {
    activeScenario = 'sample';
    return 'We can help with a sample request. Which product and quantity would you like to try, and where should we send it? Our team will confirm sample availability and shipping.';
  }
  if (/(human|person|agent|客服|人工)/.test(lower)) {
    return 'Of course. I’ve flagged this conversation for a teammate. They’ll join as soon as they’re available.';
  }
  if (/(refund|return|broken|damaged|退款|退货|损坏)/.test(lower)) {
    activeScenario = 'shipping';
    return 'I’m sorry to hear that. Please share your order number and a brief description of the issue. I’ll create a support case for our team to review.';
  }
  if (/\d{2,}/.test(lower) || /(germany|berlin|france|usa|united states|uk|italy|德国|柏林)/.test(lower)) {
    if (activeScenario === 'price') return 'Thanks, I’ve added those details to your quote request. Our sales team will confirm the exact price and lead time shortly. Would you like to include a logo or custom color?';
    if (activeScenario === 'shipping') return 'Thanks, I’ve opened a support case and passed your details to the team. They’ll verify the order and follow up with the latest update.';
  }
  return 'Thanks for the message. I can help with product details, a quote request, samples, or an order issue. If you prefer, just say “talk to a person”.';
}

function send() {
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'incoming');
  input.value = '';
  if (!isHuman) window.setTimeout(() => addMessage(botReply(text), 'outgoing'), 450);
}

$('#sendButton').addEventListener('click', send);
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') send(); });

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.dataset.scenario;
    const scripts = {
      price: ['Hi! Could you send me a quote for 500 stainless steel bottles?', 'Could you share the bottle size and delivery country? Then I can pass a complete request to our sales team.'],
      shipping: ['My order has not arrived and tracking has not updated.', 'I’m sorry about the delay. Please share your order number and the email or phone number used at checkout so our team can verify it.'],
      sample: ['Can I order a sample before placing a bulk order?', 'We can help with that. Which product and quantity would you like to sample, and where should we send it? Our team will confirm availability.']
    };
    activeScenario = scenario;
    addMessage(scripts[scenario][0], 'incoming');
    window.setTimeout(() => {
      addMessage(scripts[scenario][1], 'outgoing');
      if (scenario === 'shipping') showToast('Support case ready · Demo order data');
      else if (scenario === 'price') showToast('Lead details captured · Ready for sales');
      else showToast('Sample request started · Ready for sales');
    }, 400);
  });
});

$('#takeoverButton').addEventListener('click', (event) => {
  isHuman = !isHuman;
  const button = event.currentTarget;
  const note = document.querySelector('.composer-note span:first-child');
  const support = document.querySelector('.contact-footer small');
  if (isHuman) {
    button.innerHTML = '<span>✦</span> Return to AI';
    button.style.background = '#edf5f0';
    button.style.borderColor = '#cee0d4';
    button.style.color = '#416e56';
    note.textContent = 'You are replying · AI paused';
    support.textContent = 'AI replies will resume when you return this conversation';
    showToast('Conversation assigned to Jamie Lee');
  } else {
    button.innerHTML = '<span>↗</span> Take over conversation';
    button.style.background = '';
    button.style.borderColor = '';
    button.style.color = '';
    note.textContent = '✦ AI is handling this conversation';
    support.textContent = 'AI will pause when a teammate replies';
    showToast('Harbor AI is active again');
  }
});

document.querySelectorAll('.conversation').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelector('.conversation.selected')?.classList.remove('selected');
    item.classList.add('selected');
    const {name, issue, avatar, tone, state} = item.dataset;
    $('#chatName').textContent = name;
    $('#profileName').textContent = name;
    $('#issueText').textContent = issue;
    $('#headerAvatar').textContent = avatar;
    $('#profileAvatar').textContent = avatar;
    $('#headerAvatar').className = `contact-avatar ${tone}`;
    $('#profileAvatar').className = `profile-large ${tone}`;
    activeScenario = state === 'support' ? 'shipping' : 'price';
    isHuman = false;
    $('#takeoverButton').innerHTML = '<span>↗</span> Take over conversation';
    document.querySelector('.composer-note span:first-child').textContent = '✦ AI is handling this conversation';
    showToast(`Opened ${name} · ${issue}`);
  });
});

$('#searchInput').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('.conversation').forEach((item) => {
    item.hidden = !item.textContent.toLowerCase().includes(query);
  });
});

document.querySelector('.context-close').addEventListener('click', () => {
  document.querySelector('.chat-context').style.display = 'none';
});
document.querySelectorAll('.nav-item:not(.active),.channel-item,.help-link,.header-action,.edit-contact,.load-more').forEach((button) => {
  button.addEventListener('click', () => showToast('This view is part of the product demo preview.'));
});
