/* Case studies — rendered into project.html (?p=<slug>). */
window.PROJECTS = [
  {
    slug: 'kadeep',
    name: 'KaDeep AI',
    title: 'KaDeep AI — the site and the product, built as one',
    tags: ['Web', 'Product', 'AI'],
    type: 'Product',
    cover: 'kadeep-platform.jpg',
    images: ['kadeep-site.jpg', 'kadeep-platform.jpg'],
    intro: 'KaDeep AI helps software teams decide whether a release is ready to ship. We design and build the public site that explains the product, and the agentic platform that walks a real release and leaves the team with evidence they can judge.',
    challenge: 'The product is technical and the category is new. The site has to make the value clear in a few seconds, and the platform has to be reliable enough that an engineering leader trusts the answer. A release decision is easy to fake with a demo and hard to earn.',
    built: 'A public site with a clear path from the problem to the product, structured for search, and a platform that walks a real release and keeps the run honest. Design and engineering stay in one place, from the page a buyer sees to the systems behind it. Private screens and internal names stay off this page.',
    result: 'The site and the platform are live. The public site is where a buyer can judge the standard of the work.',
    stack: ['Next.js', 'React', 'Cloudflare', 'Agentic systems', 'Applied AI'],
    links: [{ label: 'Visit kadeep.ai', href: 'https://kadeep.ai' }]
  },
  {
    slug: 'shopbot',
    name: 'ShopBot',
    title: 'ShopBot — a WhatsApp assistant that keeps a shop answered',
    tags: ['AI Automation', 'Product Build'],
    type: 'Product build',
    cover: 'shopbot.jpg',
    images: ['shopbot-2.jpg', 'shopbot.jpg'],
    intro: 'ShopBot connects to a shop’s WhatsApp number and handles the conversations an owner cannot get to: questions, orders, bookings, and payments, in Hindi, English, or Hinglish.',
    challenge: 'Small shops run on WhatsApp, and nobody is free to reply during a rush, after hours, or on a holiday. An assistant had to understand how customers actually write, take a real order, and know when to hand the conversation to a person.',
    built: 'A service on the WhatsApp layer that can tell a question from an order, a booking, or a complaint. It answers from the shop’s own menu, hours, and policies. Orders can take a payment link. The owner gets a dashboard for conversations, orders, and bookings, plus a public shop page.',
    result: 'A complete product: the assistant, payments, the owner dashboard, and public shop pages. The AI Assistant offer for clients follows the same pattern.',
    stack: ['Node.js', 'Next.js', 'Supabase', 'Groq', 'Razorpay', 'WhatsApp'],
    links: [
      { label: 'Open the live app', href: 'https://shop-bot.vercel.app' },
      { label: 'View the product', href: 'https://github.com/ajitpatel01/ShopBot' }
    ]
  },
  {
    slug: 'subslash',
    name: 'Subslash',
    title: 'Subslash — find the subscriptions a statement is hiding',
    tags: ['Product Build', 'AI'],
    type: 'Product build',
    cover: 'subslash.jpg',
    images: ['subslash-2.jpg', 'subslash.jpg'],
    intro: 'Subslash reads a bank statement and shows every recurring charge on it, including the ones a person forgot they were paying.',
    challenge: 'Statements are long PDFs in inconsistent formats, and recurring charges hide in plain sight. The product had to find them, show the monthly cost in a way people feel, and make cancelling straightforward.',
    built: 'A person uploads a PDF. Subslash parses it, finds and groups the recurring charges, flags likely forgotten or duplicate subscriptions, and shows a monthly burn rate. One step drafts a cancellation letter for a service.',
    result: 'A working product, live and public, from the PDF parser through the dashboard.',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'Claude', 'Vercel'],
    links: [
      { label: 'Open subslash.vercel.app', href: 'https://subslash.vercel.app' },
      { label: 'View the product', href: 'https://github.com/dakshsahu1803/Subslash' }
    ]
  },
  {
    slug: 'apnicar',
    name: 'ApniCar',
    title: 'ApniCar — car discovery with the running cost in view',
    tags: ['Product Build', 'Web'],
    type: 'Product build',
    cover: 'apnicar.jpg',
    images: ['apnicar-2.jpg', 'apnicar.jpg'],
    intro: 'ApniCar is a car discovery marketplace. Buyers browse listings and can also see what a car is likely to cost them over time.',
    challenge: 'The sticker price is only part of what a car costs. Buyers needed listings and a way to think about fuel and running cost in one place.',
    built: 'A listings marketplace with featured cars and browsing, paired with an expense forecast. The forecast uses price and fuel data to project what a car may cost later.',
    result: 'A product build, deployed and public. It was not a client engagement, so we do not present its on-site figures as studio results.',
    stack: ['Web', 'Python', 'Forecasting models'],
    links: [
      { label: 'Open the live site', href: 'https://visionary-entremet-43657f.netlify.app/' }
    ]
  },
  {
    slug: 'gcnshield',
    name: 'GCNShield',
    title: 'GCNShield — fraud detection that reads the relationships, not just the row',
    tags: ['Research', 'Machine Learning'],
    type: 'Published research',
    cover: 'gcnshield.jpg',
    images: ['gcnshield-2.jpg', 'gcnshield.jpg'],
    intro: 'GCNShield: Advanced Fraud Detection in Payment Systems Using Graph Convolutional Networks was accepted at ICISESSC. It was written with Ayush Kumar, under the guidance of Dr. Simar Preet Singh.',
    challenge: 'Fraud rarely looks unusual one transaction at a time. It shows up in the relationships between accounts, merchants, and payments, and models that only read a table tend to miss it.',
    built: 'A model that joins tabular payment data with the graph of who transacts with whom, so it learns from each payment and from the neighborhood around it.',
    result: 'In the paper’s experiments, GCNShield beat the baseline models it was compared against. The method and the full results are in the published paper.',
    stack: ['Graph convolutional networks', 'Python', 'Tabular and graph features'],
    links: [
      { label: 'Read on IEEE Xplore', href: 'https://ieeexplore.ieee.org/document/11542599' },
      { label: 'Read the announcement', href: 'https://www.linkedin.com/posts/ajitpatel404_graphneuralnetworks-frauddetection-fintech-activity-7506709202925461504-XtJ7' }
    ]
  }
];

(function renderProject() {
  if (!document.body || document.body.dataset.page !== 'project') return;
  const list = window.PROJECTS;
  const asked = new URLSearchParams(location.search).get('p');
  const slug = (asked === 'kadeep-site' || asked === 'kadeep-product') ? 'kadeep' : asked;
  const i = list.findIndex((p) => p.slug === slug);
  if (i < 0) {
    location.replace('projects.html');
    return;
  }
  const p = list[i];
  const img = (f) => `assets/img/${f}`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const set = (key, val) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => (el.textContent = val));
  const html = (key, val) => document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => (el.innerHTML = val));
  const arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  const extLink = (l) => `<a class="link" href="${l.href}" target="_blank" rel="noopener">${esc(l.label)} <span class="arrow">${arrowSvg}${arrowSvg}</span></a>`;

  document.title = `${p.name} — Devine Studio`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', p.intro);
  set('title', p.title);
  set('type', p.type);
  const by = document.querySelector('[data-bind="by"]');
  if (by) {
    const row = by.closest('div');
    if (row) row.remove();
  }
  set('intro', p.intro);
  set('challenge', p.challenge);
  set('built', p.built);
  set('result', p.result);
  html('chips', p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join(''));
  html('stack', p.stack.map((t) => `<li>${esc(t)}</li>`).join(''));
  html('links', p.links.map(extLink).join(''));
  const cover = document.querySelector('[data-bind="cover"]');
  cover.src = img(p.cover);
  cover.alt = p.name;

  document.querySelectorAll('[data-shot]').forEach((slot) => {
    const n = +slot.dataset.shot;
    const f = p.images[n];
    if (!f) { slot.remove(); return; }
    const im = slot.querySelector('img');
    im.src = img(f);
    im.alt = `${p.name}, detail ${n + 1}`;
  });

  const others = [list[(i + 1) % list.length], list[(i + 2) % list.length]];
  html('others', others.map((o, k) => `
    <a class="card" href="project.html?p=${o.slug}" data-reveal style="--d:${k * 120}">
      <div class="card__media"><img src="${img(o.cover)}" alt="${esc(o.name)}" loading="lazy"><span class="card__view">View</span></div>
      <div class="card__meta"><h3 class="card__title">${esc(o.name)}</h3><div class="tags">${o.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
    </a>`).join(''));
})();
