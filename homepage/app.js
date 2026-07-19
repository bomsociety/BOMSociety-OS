document.addEventListener("submit", (event) => {
  const form = event.target.closest(".signup");
  if (!form) return;
  event.preventDefault();
  window.dispatchEvent(new CustomEvent("bomsociety:newsletter_signup", {
    detail: { source: "homepage" }
  }));
  form.reset();
  const button = form.querySelector("button");
  button.textContent = "You're in";
  button.disabled = true;
});
