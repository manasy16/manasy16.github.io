/* Portfolio JS — Manas Yadav */

// ─── Firebase Setup ───────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYAhzzY_kUqdFh29qDq9Mos4IKA3VMDIU",
  authDomain: "manas-portfolio-5161d.firebaseapp.com",
  projectId: "manas-portfolio-5161d",
  storageBucket: "manas-portfolio-5161d.firebasestorage.app",
  messagingSenderId: "364563439853",
  appId: "1:364563439853:web:cd2a4944795cc0517eece4"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const PROJECTS_COL = "projects";

// ─── Typed effect ────────────────────────────────────────
const phrases = [
  "AI / ML Developer",
  "Python Backend Engineer",
  "Data Analysis Enthusiast",
  "Cybersecurity Learner",
  "B.Tech CS · Final Year",
];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typedEl = document.getElementById("typed");

function type() {
  if (!typedEl) return;
  const current = phrases[phraseIdx];
  if (!deleting) {
    typedEl.textContent = current.slice(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
  } else {
    typedEl.textContent = current.slice(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
    }
  }
  setTimeout(type, deleting ? 50 : 75);
}
type();

// ─── Navbar scroll state ─────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
});

// ─── Mobile drawer ───────────────────────────────────────
const burger        = document.getElementById("burger");
const drawer        = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose   = document.getElementById("drawerClose");

function openDrawer()  { drawer.classList.add("open"); drawerOverlay.classList.add("open"); document.body.style.overflow = "hidden"; }
function closeDrawer() { drawer.classList.remove("open"); drawerOverlay.classList.remove("open"); document.body.style.overflow = ""; }

burger.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// ─── Smooth scroll ───────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const href = a.getAttribute("href");
    if (href.length > 1) {
      e.preventDefault();
      const target = href === "#home" ? document.body : document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ─── Scroll reveal ───────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  revealObserver.observe(el);
});

// ─── Contact form (Formspree) ────────────────────────────
const contactForm = document.getElementById("contactForm");
const formStatus  = document.getElementById("formStatus");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Sending…";
    formStatus.textContent = "";
    formStatus.className = "form-status";

    try {
      const res = await fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        btn.textContent = "✓ Message Sent!";
        formStatus.textContent = "Thanks! I'll get back to you soon.";
        formStatus.classList.add("ok");
        contactForm.reset();
      } else {
        throw new Error("Network response was not ok");
      }
    } catch (err) {
      btn.textContent = "Send Message";
      formStatus.textContent = "Something went wrong — please email me directly.";
      formStatus.classList.add("err");
    } finally {
      setTimeout(() => { btn.textContent = "Send Message"; btn.disabled = false; }, 2500);
    }
  });
}
// ─── Admin Panel — Firestore backed ──────────────────────
// Open: click "MY." logo 5 times within 1.5s → password prompt
// Password: GLB2027Manas! (stored as SHA-256 hash, never in plain text)
const PASS_HASH = "edb1c5f60f06b659991391476a659a5b377bcf79463dd86de446738f36eafa6f";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Firestore helpers ────────────────────────────────────
async function loadProjects() {
  const snap = await getDocs(collection(db, PROJECTS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function addProject(p)    { return (await addDoc(collection(db, PROJECTS_COL), p)).id; }
async function removeProject(id){ await deleteDoc(doc(db, PROJECTS_COL, id)); }

// ─── Render ───────────────────────────────────────────────
async function renderExtraProjects() {
  const grid            = document.getElementById("projectsGrid");
  const deployedGrid    = document.getElementById("deployedGrid");
  const deployedSection = document.getElementById("deployedSection");
  if (!grid) return;

  grid.querySelectorAll(".project-card.dynamic").forEach(el => el.remove());
  if (deployedGrid) deployedGrid.querySelectorAll(".project-card.dynamic").forEach(el => el.remove());

  const all      = await loadProjects();
  const deployed = all.filter(p => p.demo);
  const others   = all.filter(p => !p.demo);

  const makeCard = (p) => {
    const a = document.createElement("article");
    a.className = "project-card reveal visible dynamic";
    a.innerHTML = `
      <div class="project-domain-bar ${p.barClass || "domain-aiml"}">${p.tag || "Project"}</div>
      <div class="project-body">
        <h3>${p.title}</h3>
        <p class="project-blurb">${p.blurb}</p>
        <div class="project-stack">${(p.stack || []).map(s => `<span>${s}</span>`).join("")}</div>
      </div>
      <div class="project-footer">
        ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="project-link"><i class="fab fa-github"></i> View on GitHub</a>` : ""}
        ${p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener" class="project-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : ""}
      </div>`;
    return a;
  };

  deployed.forEach(p => deployedGrid && deployedGrid.appendChild(makeCard(p)));
  others.forEach(p => grid.appendChild(makeCard(p)));
  if (deployedSection) deployedSection.style.display = deployed.length ? "" : "none";
}
renderExtraProjects();

// ─── Secret trigger: click logo 5x quickly ───────────────
const logoTrigger  = document.getElementById("logoTrigger");
const adminOverlay = document.getElementById("adminOverlay");
const adminBox     = document.getElementById("adminBox");
let clickCount = 0, clickTimer = null;

if (logoTrigger) {
  logoTrigger.addEventListener("click", (e) => {
    clickCount++;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 1500);
    if (clickCount >= 5) { clickCount = 0; e.preventDefault(); openAdminLogin(); }
  });
}

function openOverlay()  { adminOverlay.classList.add("open"); }
function closeOverlay() { adminOverlay.classList.remove("open"); adminBox.innerHTML = ""; }

function openAdminLogin() {
  adminBox.innerHTML = `
    <h3>🔒 Admin Access</h3>
    <input type="password" id="adminPass" placeholder="Enter password" />
    <p class="admin-error" id="adminErr" style="display:none">Incorrect password.</p>
    <div class="admin-actions">
      <button class="btn-secondary" id="adminCancel">Cancel</button>
      <button class="btn-primary" id="adminLoginBtn">Unlock</button>
    </div>`;
  openOverlay();
  const passInput = document.getElementById("adminPass");
  passInput.focus();
  const tryLogin = async () => {
    const hash = await sha256(passInput.value);
    if (hash === PASS_HASH) { openAdminPanel(); }
    else { document.getElementById("adminErr").style.display = "block"; passInput.value = ""; }
  };
  document.getElementById("adminLoginBtn").addEventListener("click", tryLogin);
  passInput.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
  document.getElementById("adminCancel").addEventListener("click", closeOverlay);
}

async function openAdminPanel() {
  const projects = await loadProjects();
  adminBox.innerHTML = `
    <h3>➕ Add Project</h3>
    <input type="text"      id="pTitle" placeholder="Project title" />
    <textarea               id="pBlurb" rows="3" placeholder="Short description"></textarea>
    <input type="text"      id="pStack" placeholder="Tech stack, comma separated" />
    <input type="text"      id="pLink"  placeholder="GitHub link (optional)" />
    <input type="text"      id="pDemo"  placeholder="Live demo / deployed link (optional)" />
    <select id="pBar">
      <option value="domain-backend">Backend + AI</option>
      <option value="domain-aiml">ML + Data</option>
      <option value="domain-llm">LLM + RAG</option>
    </select>
    <input type="text" id="pTag" placeholder="Badge text (e.g. New · Live)" />
    <p class="admin-error" id="pErr" style="display:none">Title and description are required.</p>
    <div class="admin-actions">
      <button class="btn-secondary" id="adminClose">Close</button>
      <button class="btn-primary"   id="adminAddBtn">Add to Firebase</button>
    </div>
    <h3 style="margin-top:18px">Saved Projects (${projects.length})</h3>
    <div id="adminList">
      ${projects.length === 0
        ? "<p style='opacity:.6;font-size:.85rem'>None yet.</p>"
        : projects.map(p => `
          <div class="admin-list-item">
            <span>${p.title}${p.demo ? " 🚀" : ""}</span>
            <button class="adminDelete" data-id="${p.id}">Remove</button>
          </div>`).join("")}
    </div>`;

  document.getElementById("adminClose").addEventListener("click", closeOverlay);

  document.getElementById("adminAddBtn").addEventListener("click", async () => {
    const title    = document.getElementById("pTitle").value.trim();
    const blurb    = document.getElementById("pBlurb").value.trim();
    const stack    = document.getElementById("pStack").value.split(",").map(s => s.trim()).filter(Boolean);
    const link     = document.getElementById("pLink").value.trim();
    const demo     = document.getElementById("pDemo").value.trim();
    const barClass = document.getElementById("pBar").value;
    const tag      = document.getElementById("pTag").value.trim();
    if (!title || !blurb) { document.getElementById("pErr").style.display = "block"; return; }

    const btn = document.getElementById("adminAddBtn");
    btn.textContent = "Saving…"; btn.disabled = true;
    await addProject({ title, blurb, stack, link, demo, barClass, tag });
    await renderExtraProjects();
    await openAdminPanel(); // refresh list
  });

  adminBox.querySelectorAll(".adminDelete").forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.textContent = "…"; btn.disabled = true;
      await removeProject(btn.dataset.id);
      await renderExtraProjects();
      await openAdminPanel();
    });
  });

  openOverlay();
}

adminOverlay.addEventListener("click", (e) => { if (e.target === adminOverlay) closeOverlay(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(); });