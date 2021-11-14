const fs = require("fs-extra");

const listGroup = document.getElementById("list-group");
const workPanel = document.getElementById("work-panel");
const faultInput = document.getElementById("fault-input");
const infoPanel = document.getElementById("info-panel");
const workDoneButton = document.getElementById("work-done-button");

let refreshInterval;

let works = [];
let results = [];

document.addEventListener("DOMContentLoaded", async function () {
  await readConfig();

  refreshInterval = setInterval(refreshDirectories, 1000);
});

async function refreshDirectories() {
  let dates = [];

  infoPanel.style.display = "none";

  const directories = (
    await fs.readdir(global.config.sharedDirectoryPath)
  ).filter((e) => e.split(".").length <= 1);

  dates = directories.map(async (directory) => {
    const files = await fs.readdir(
      global.config.sharedDirectoryPath + "\\" + directory
    );

    return { name: directory, files: files };
  });

  await Promise.all(dates);

  listGroup.innerHTML = "";
  dates.forEach((promise) => {
    promise.then((directory) => {
      const element = document.createElement("li");
      element.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-start",
        "short"
      );
      element.innerHTML =
        `<div class="fw-bold">${directory.name}</div>` +
        `<span class="badge bg-primary rounded-pill">${directory.files.length}</span>`;

      element.addEventListener("click", () => {
        clearInterval(refreshInterval);
        listGroup.innerHTML = "";

        directory.files.forEach((file) => {
          const content = fs.readFileSync(
            global.config.sharedDirectoryPath +
              "\\" +
              directory.name +
              "\\" +
              file,
            { encoding: "utf-8", flag: "r" },
            function (err) {
              if (err) {
                console.log(err);
              }
            }
          );

          works.push({ name: file.split(".")[0], content: content });
        });

        infoPanel.style.display = "";
        newWork();
      });

      listGroup.append(element);
    });
  });
}

function newWork() {
  let work = works[0];

  const h2 = document.createElement("h2");
  h2.classList.add("center-text");
  h2.innerHTML += work.name;

  const p = document.createElement("p");
  p.classList.add("courier-text", "spellcheck-text", "left-text");
  p.setAttribute("spellcheck", "true");
  p.setAttribute("contenteditable", "true");
  p.focus();
  p.innerHTML = work.content.replace(new RegExp("\r?\n", "g"), "<br />");

  h2.append(p);

  workPanel.innerHTML = "";
  workPanel.append(h2);
}

async function readConfig() {
  const localConfig = JSON.parse(await fs.readFileSync("./app-config.json"));

  global.config = {
    sharedDirectoryPath: localConfig.sharedDirectoryPath,
  };
}

workDoneButton.onclick = () => {
  let currentWork = works[0];
  let faults = parseInt(faultInput.value);

  results.push({ name: currentWork.name, faults: faults });

  works.shift();

  if (works.length <= 0) {
    workPanel.innerHTML = `<h2 class="center-text">Összegzés</h2>`;

    results.forEach((result) => {
      workPanel.innerHTML += `<b>${result.name}</b> - ${
        currentWork.content.length
      } karakter - ${result.faults ? result.faults : 0} hiba<br />`;
    });

    workPanel.innerHTML += `<br /><br /><button class="btn btn-primary" onclick="window.close()">Kész, kilépés</button>`;

    infoPanel.style.display = "none";
  } else {
    newWork();
    faultInput.value = "";
  }
};
