const canvas = document.getElementById("code-rain");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();

const letters = "01010101101101010101010101110101010101010010101010100110100110100101010101010101010101";

const chars = letters.split("");

const fontSize = 14;
let columns = canvas.width / fontSize;

let drops = [];

function initDrops() {

    drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }
}

initDrops();

function draw() {

    ctx.fillStyle = "rgba(4,5,12,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffe7";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {

        const text =
            chars[Math.floor(Math.random() * chars.length)];

        ctx.fillText(
            text,
            i * fontSize,
            drops[i] * fontSize
        );

        if (
            drops[i] * fontSize > canvas.height &&
            Math.random() > 0.975
        ) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

setInterval(draw, 35);

window.addEventListener("resize", () => {

    resize();

    columns = canvas.width / fontSize;

    initDrops();

});
