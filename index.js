import fetch from "node-fetch";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";

const LAT = 40.47;
const LON = -3.69;

const WIDTH = 1090;
const HEIGHT = 540;

const TIME_SLOTS = 14;

const COLUMN_WIDTH = WIDTH / 14;

const HEADER_HEIGHT = HEIGHT / 2;
const HEADER_PADDING = 20;
const HEADER_FONT_SIZE = 58;

const getIcon = async (d) => {
  const img = await loadImage(`./icons/${d.symbol}.png`);

  return img;
};

const drawTempBox = (x, ctx, tmp, text, fontSize = 30) => {
  ctx.font = `bold 120px Ubuntu`;
  ctx.fillText(tmp, HEADER_PADDING + x + 60, HEADER_FONT_SIZE + HEADER_PADDING + 100);

  ctx.font = `${fontSize}px Ubuntu`;
  ctx.fillText(
    text,
    HEADER_PADDING + x + 40,
    HEADER_FONT_SIZE + HEADER_PADDING + 140,
  );
};

const drawSmallTempBox = (x, ctx, tmp, text, fontSize = 30) => {
  ctx.font = `70px Ubuntu`;
  ctx.fillText(tmp, HEADER_PADDING + x, HEADER_FONT_SIZE + HEADER_PADDING + 80);

  ctx.font = `${fontSize}px Ubuntu`;
  ctx.fillText(
    text,
    HEADER_PADDING + x - 10,
    HEADER_FONT_SIZE + HEADER_PADDING + 120,
  );
};

const drawHeader = async (ctx, current) => {
  ctx.font = `${HEADER_FONT_SIZE}px Ubuntu`;
  ctx.fillText(
    "Madrid",
    HEADER_PADDING + 100,
    HEADER_FONT_SIZE + HEADER_PADDING / 2,
  );

  const img = await getIcon(current);

  ctx.drawImage(img, HEADER_PADDING, HEADER_PADDING + 60, 200, 180);

  drawTempBox(380, ctx, `${Math.round(current.temp)}°`, "Actual");
};

const drawLine = (x, ctx) => {
  ctx.beginPath();
  ctx.moveTo(x, HEADER_HEIGHT);
  ctx.lineTo(x, HEIGHT);
  ctx.strokeStyle = "#ccc";
  ctx.stroke();
};

async function drawWeather() {
	const response = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${LAT}&lon=${LON}`, {
			headers: {
				"User-Agent": "Weather Personal Project"
			}
	});
	const json = await response.json();

  const [current, ...data] = json.properties.timeseries
    .slice(0, TIME_SLOTS + 1)
    .map((entry) => ({
      time: new Date(entry.time).getHours(),
      temp: entry.data.instant.details.air_temperature,
      symbol: entry.data.next_1_hours?.summary.symbol_code || "clearsky_day",
      humidity: entry.data.instant.details.relative_humidity,
    }));

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.textAlign = "center";

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "black";

  ctx.beginPath(HEADER_HEIGHT);
  ctx.moveTo(0, HEADER_HEIGHT);
  ctx.lineTo(WIDTH, HEADER_HEIGHT);
  ctx.strokeStyle = "#ccc";
  ctx.stroke();

  await drawHeader(ctx, current);

  const maxTemp = Math.max(...[current, ...data].map((d) => d.temp));
  const minTemp = Math.min(...[current, ...data].map((d) => d.temp));

  drawSmallTempBox(700, ctx, `${Math.round(minTemp)}°`, "Mínima");

  drawSmallTempBox(900, ctx, `${Math.round(maxTemp)}°`, "Máxima");

  data.forEach(async (d, i) => {
    const x = i * COLUMN_WIDTH;
    ctx.font = "bold 22px Sans";
    ctx.fillText(
      `${d.time.toString().padStart(2, "0")}:00`,
      x + 40,
      HEADER_HEIGHT + 30,
    );

    ctx.font = "22px Sans";

    ctx.fillText(`${Math.round(d.temp)}°`, x + 40, HEADER_HEIGHT + 60);

    drawLine(x, ctx);

    const img = await getIcon(d);

    ctx.drawImage(img, x + 20, HEADER_HEIGHT + 75, 40, 40);

    const barHeight =
      ((d.temp - minTemp) / (maxTemp - minTemp)) *
      (HEIGHT - HEADER_HEIGHT - 140);

    ctx.fillStyle = "grey";
    ctx.fillRect(x + 30, HEADER_HEIGHT + 250 - barHeight, 20, barHeight);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("weather.png", buffer);
  });
}

drawWeather();
