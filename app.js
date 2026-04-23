const prayers = [
  { name: "Фаджр", ar: "الفجر", time: "03:31" },
  { name: "Восход", ar: "الشروق", time: "05:02" },
  { name: "Зухр", ar: "الظهر", time: "11:49" },
  { name: "Аср", ar: "العصر", time: "15:36" },
  { name: "Магриб", ar: "المغرب", time: "18:37" },
  { name: "Иша", ar: "العشاء", time: "20:02" },
];

const prayerCards = document.getElementById("prayer-cards");
const nav = document.getElementById("bottom-nav");
const screens = [...document.querySelectorAll(".screen")];
const navButtons = [...document.querySelectorAll(".nav-btn")];
const needle = document.getElementById("needle");
const directionValue = document.getElementById("direction-value");
const directionMessage = document.getElementById("direction-message");
const tiltValue = document.getElementById("tilt-value");
const timeNow = document.getElementById("time-now");
const tasbihCount = document.getElementById("tasbih-count");

let count = 0;
let heading = 183;

function renderPrayerCards() {
  prayerCards.innerHTML = prayers
    .map(
      (prayer) => `
      <article class="prayer-card">
        <div>
          <h3>${prayer.name}</h3>
          <p>${prayer.ar}</p>
        </div>
        <strong>${prayer.time}</strong>
      </article>
    `,
    )
    .join("");
}

function setActiveScreen(target) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === target);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === target);
  });
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  timeNow.textContent = `${hours}:${mins}`;
}

function updateCompass(newHeading) {
  heading = Math.round((newHeading + 360) % 360);
  needle.style.transform = `rotate(${heading}deg)`;
  directionValue.textContent = `${heading}°`;

  const qiblaAzimuth = 192;
  let diff = qiblaAzimuth - heading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) <= 5) {
    directionMessage.textContent = "Почти точно. Направление совпадает с киблой.";
  } else {
    const side = diff > 0 ? "вправо" : "влево";
    directionMessage.textContent = `Повернись ${side} примерно на ${Math.abs(diff)}°`;
  }
  tiltValue.textContent = `${Math.round(Math.abs(diff))}°`;
}

nav.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-btn");
  if (!button) return;
  setActiveScreen(button.dataset.target);
});

document.getElementById("add-count").addEventListener("click", () => {
  count += 1;
  tasbihCount.textContent = count;
  navigator.vibrate?.(20);
});

document.getElementById("reset-count").addEventListener("click", () => {
  count = 0;
  tasbihCount.textContent = count;
});

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (event) => {
    if (typeof event.alpha === "number") {
      updateCompass(360 - event.alpha);
    }
  });
} else {
  setInterval(() => updateCompass(heading + (Math.random() * 10 - 5)), 1600);
}

renderPrayerCards();
updateClock();
setInterval(updateClock, 1000 * 30);
updateCompass(heading);
