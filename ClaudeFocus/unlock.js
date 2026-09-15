let currentProblems = [];

async function loadProblems() {
  const res = await chrome.runtime.sendMessage({ type: "START_UNLOCK_CHALLENGE" });
  currentProblems = res.problems;
  const container = document.getElementById("problems");
  container.innerHTML = "";
  for (const p of currentProblems) {
    const row = document.createElement("div");
    row.className = "problem";
    row.innerHTML = `<span>${p.text} =</span>`;
    const input = document.createElement("input");
    input.type = "number";
    input.dataset.id = p.id;
    row.appendChild(input);
    container.appendChild(row);
  }
  const msg = document.getElementById("msg");
  msg.textContent = "";
  msg.className = "";
  if (container.firstElementChild) {
    container.firstElementChild.querySelector("input").focus();
  }
}

document.getElementById("submitBtn").addEventListener("click", async () => {
  const inputs = [...document.querySelectorAll("#problems input")];
  const answers = inputs.map((inp) => inp.value);
  if (answers.some((v) => v === "")) {
    const msg = document.getElementById("msg");
    msg.textContent = "Answer every problem first.";
    msg.className = "error";
    return;
  }
  const res = await chrome.runtime.sendMessage({ type: "SUBMIT_UNLOCK_ANSWERS", answers });
  const msg = document.getElementById("msg");
  if (res.ok) {
    msg.textContent = "Correct. Blocking is now off.";
    msg.className = "ok";
    setTimeout(() => window.close(), 900);
  } else {
    msg.textContent = "Wrong answer(s). New problems generated.";
    msg.className = "error";
    loadProblems();
  }
});

document.getElementById("cancelBtn").addEventListener("click", () => window.close());

loadProblems();
