const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menu.classList.toggle("is-open", !open);
    document.body.classList.toggle("menu-open", !open);
  });

  menu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    }
  });
}

const signup = document.querySelector("[data-signup]");
if (signup) {
  signup.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = signup.querySelector("[data-form-status]");
    const button = signup.querySelector("button");
    const formData = new FormData(signup);

    window.dispatchEvent(new CustomEvent("bomsociety:newsletter_signup", {
      detail: {
        source: "homepage",
        email_provided: Boolean(formData.get("email"))
      }
    }));

    signup.reset();
    button.textContent = "You're in";
    button.disabled = true;
    status.textContent = "Welcome to BOMSociety.";
  });
}

window.dispatchEvent(new CustomEvent("bomsociety:page_view", {
  detail: { page: "homepage" }
}));
