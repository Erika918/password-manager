// script.js — versão melhorada
(async function () {
  const LIST_ID = "password-list";
  const SEARCH_ID = "search";
  const STORAGE_KEY = "senhas-data-v1"; // versão para invalidar cache local ao atualizar estrutura

  const listEl = document.getElementById(LIST_ID);
  const searchEl = document.getElementById(SEARCH_ID);

  // Carrega dados: tenta fetch -> se falhar usa localStorage -> se não, array vazio
  async function loadData() {
    try {
      const res = await fetch("senhas.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Resposta não OK");
      const data = await res.json();
      // salva cópia local para uso offline
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn("fetch falhou, tentando localStorage:", err);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("localStorage corrompido:", e);
        }
      }
      return []; // fallback seguro
    }
  }

  // Salva dados atualizados no localStorage (não altera o arquivo senhas.json no servidor)
  function saveDataLocal(updatedData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (err) {
      console.error("Erro ao salvar localmente:", err);
    }
  }

  // Evita inserção de quebras de linha em contenteditable
  function sanitizeEditableInput(el) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
    });
  }

  // Monta um cartão de senha
  function createCard(item, index, dataRef) {
    const card = document.createElement("div");
    card.className = "password-card";
    card.dataset.index = index;

    // Mantemos senha oculta por padrão, com botão mostrar/ocultar
    card.innerHTML = `
      <div><strong>🌐 Site:</strong> <span class="editavel site" contenteditable="true" aria-label="site">${escapeHtml(item.website)}</span></div>
      <div><strong>👤 Usuário:</strong> <span class="editavel user" contenteditable="true" aria-label="usuário">${escapeHtml(item.username)}</span></div>
      <div>
        <strong>🔑 Senha:</strong>
        <span class="password-mask" aria-hidden="true">••••••••</span>
        <span class="editavel pass" contenteditable="true" style="display:none" aria-label="senha">${escapeHtml(item.password)}</span>
        <button class="toggle-pass" aria-pressed="false" title="Mostrar senha">👁️</button>
      </div>
      <div style="margin-top:8px">
        <button class="share-btn">📤 Compartilhar</button>
        <button class="save-btn">💾 Salvar</button>
      </div>
    `;

    // prevenir enter em contenteditable
    const editables = card.querySelectorAll(".editavel");
    editables.forEach(sanitizeEditableInput);

    // toggle mostrar/ocultar senha
    const toggleBtn = card.querySelector(".toggle-pass");
    const maskEl = card.querySelector(".password-mask");
    const passEl = card.querySelector(".editavel.pass");
    toggleBtn.addEventListener("click", () => {
      const shown = passEl.style.display === "inline" || passEl.style.display === "block";
      if (shown) {
        passEl.style.display = "none";
        maskEl.style.display = "";
        toggleBtn.textContent = "👁️";
        toggleBtn.setAttribute("aria-pressed", "false");
      } else {
        passEl.style.display = "inline";
        maskEl.style.display = "none";
        toggleBtn.textContent = "🙈";
        toggleBtn.setAttribute("aria-pressed", "true");
      }
    });

    // compartilhar
    card.querySelector(".share-btn").addEventListener("click", async () => {
      const site = card.querySelector(".site").innerText.trim();
      const user = card.querySelector(".user").innerText.trim();
      const pass = passEl.style.display !== "none" ? passEl.innerText.trim() : item.password; // use original ou editado se exibido

      const text = `🌐 ${site}\n👤 Usuário: ${user}\n🔑 Senha: ${pass}`;

      try {
        if (navigator.share) {
          await navigator.share({ title: `Acesso: ${site}`, text });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          alert("✅ Dados copiados para a área de transferência!");
        } else {
          // último recurso
          prompt("Copie os dados abaixo:", text);
        }
      } catch (err) {
        console.warn("Compartilhamento falhou:", err);
      }
    });

    // salvar alterações no localStorage
    card.querySelector(".save-btn").addEventListener("click", () => {
      const newSite = card.querySelector(".site").innerText.trim();
      const newUser = card.querySelector(".user").innerText.trim();
      const newPass = card.querySelector(".pass").innerText.trim();

      // atualiza referência de dados (array em memória)
      dataRef[index] = {
        website: newSite,
        username: newUser,
        password: newPass
      };

      saveDataLocal(dataRef);
      // atualiza máscara / feedback visual
      maskEl.textContent = "••••••••";
      maskEl.style.display = "";
      passEl.style.display = "none";
      toggleBtn.textContent = "👁️";
      toggleBtn.setAttribute("aria-pressed", "false");

      // feedback
      flashMessage("Salvo localmente!");
    });

    return card;
  }

  // Função utilitária para mensagem rápida
  function flashMessage(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "8px 14px",
      borderRadius: "8px",
      zIndex: 9999,
      opacity: "0.95"
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  // Escape básico para evitar interpretações HTML (simples XSS mitigation)
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Renderiza lista com filtro
  function renderPasswords(data, filter = "") {
    listEl.innerHTML = "";
    const term = filter.trim().toLowerCase();
    data.forEach((item, idx) => {
      if (!term || (item.website && item.website.toLowerCase().includes(term))) {
        const card = createCard(item, idx, data);
        listEl.appendChild(card);
      }
    });
  }

  // Inicialização
  const data = await loadData(); // array de objetos {website,username,password}
  renderPasswords(data);

  // Filtro de pesquisa
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      renderPasswords(data, e.target.value);
    });
  }

  // opcional: expor para console para debug
  window.__senhas = data;
})();
