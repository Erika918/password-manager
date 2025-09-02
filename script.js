async function loadPasswords() {
  const response = await fetch("senhas.json");
  const data = await response.json();
  const list = document.getElementById("password-list");

  function renderPasswords(filter = "") {
    list.innerHTML = "";
    data
      .filter(item => item.website.toLowerCase().includes(filter.toLowerCase()))
      .forEach(item => {
        const card = document.createElement("div");
        card.className = "password-card";

        card.innerHTML = `
          <div><strong>🌐 Site:</strong> <span class="editavel" contenteditable="true">${item.website}</span></div>
          <div><strong>👤 Usuário:</strong> <span class="editavel" contenteditable="true">${item.username}</span></div>
          <div><strong>🔑 Senha:</strong> <span class="editavel" contenteditable="true" style="color:red">${item.password}</span></div>
          <button class="share-btn">📤 Compartilhar</button>
        `;

        // ação do botão de compartilhar
        card.querySelector(".share-btn").addEventListener("click", () => {
          const site = card.querySelectorAll(".editavel")[0].innerText;
          const user = card.querySelectorAll(".editavel")[1].innerText;
          const pass = card.querySelectorAll(".editavel")[2].innerText;

          const text = `🌐 ${site}\n👤 Usuário: ${user}\n🔑 Senha: ${pass}`;

          if (navigator.share) {
            navigator.share({
              title: "Acesso",
              text: text
            }).catch(err => console.log("Compartilhamento cancelado", err));
          } else {
            navigator.clipboard.writeText(text).then(() => {
              alert("✅ Dados copiados para a área de transferência!");
            });
          }
        });

        list.appendChild(card);
      });
  }

  // Filtro de pesquisa
  document.getElementById("search").addEventListener("input", (e) => {
    renderPasswords(e.target.value);
  });

  renderPasswords();
}

loadPasswords();
