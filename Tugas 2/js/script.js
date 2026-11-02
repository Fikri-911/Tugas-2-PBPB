
const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m";
const JUMLAH_AWAL = 10;


const el = {
  body: document.getElementById("tabel-body"),
  wrap: document.getElementById("table-wrap"),
  chart: document.getElementById("chart"),
  notice: document.getElementById("notice"),
  toggle: document.getElementById("toggle"),
  rentang: document.getElementById("rentang"),
  max: document.getElementById("stat-max"),
  maxTime: document.getElementById("stat-max-time"),
  min: document.getElementById("stat-min"),
  minTime: document.getElementById("stat-min-time"),
  avg: document.getElementById("stat-avg"),
  count: document.getElementById("stat-count"),
  heroTemp: document.getElementById("hero-temp"),
  heroTime: document.getElementById("hero-time"),
  heroUpdated: document.getElementById("hero-updated"),
};

let semuaData = [];
let tampilSemua = false;


const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function keDate(teks) {
  return new Date(teks + ":00Z");
}

function formatTanggal(d) {
  return pad(d.getUTCDate()) + " " + BULAN[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

function formatJam(d) {
  return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
}

function formatWIB(d) {
  const wib = new Date(d.getTime() + 7 * 3600 * 1000);
  const tambahHari = wib.getUTCDate() !== d.getUTCDate() ? " (+1 hari)" : "";
  return formatJam(wib) + " WIB" + tambahHari;
}

function formatSuhu(n) {
  return n.toFixed(1) + " °C";
}

function indeksTerdekat() {
  const sekarang = Date.now();
  let terbaik = 0;
  let selisihTerkecil = Infinity;

  semuaData.forEach((item, i) => {
    const selisih = Math.abs(keDate(item.time).getTime() - sekarang);
    if (selisih < selisihTerkecil) {
      selisihTerkecil = selisih;
      terbaik = i;
    }
  });
  return terbaik;
}

function tampilkanHero() {
  const item = semuaData[indeksTerdekat()];
  const d = keDate(item.time);

  el.heroTemp.textContent = formatSuhu(item.temp);
  el.heroTime.textContent = formatTanggal(d) + ", " + formatJam(d) + " GMT (" + formatWIB(d) + ")";

  const kini = new Date();
  el.heroUpdated.textContent = pad(kini.getHours()) + ":" + pad(kini.getMinutes());
}

function tampilkanSkeleton() {
  let html = "";
  for (let i = 0; i < JUMLAH_AWAL; i++) {
    html +=
      '<tr><td><span class="skeleton" style="width:60%"></span></td>' +
      '<td><span class="skeleton" style="width:90%"></span></td></tr>';
  }
  el.body.innerHTML = html;
}

function tampilkanTabel(list) {
  const nilai = list.map((d) => d.temp);
  const min = Math.min(...nilai);
  const max = Math.max(...nilai);
  const selisih = max - min || 1;

  const waktuTerdekat = semuaData[indeksTerdekat()].time;

  let html = "";
  list.forEach((item) => {
    const d = keDate(item.time);
    const norm = (item.temp - min) / selisih; 
    const lebar = 15 + norm * 85; 
    const hue = Math.round(200 - norm * 175);
    const kelas = item.time === waktuTerdekat ? ' class="now"' : "";

    html +=
      "<tr" + kelas + ">" +
      '<td><div class="waktu"><strong>' + formatTanggal(d) + ", " + formatJam(d) + "</strong>" +
      "<small>" + formatWIB(d) + "</small></div></td>" +
      '<td><div class="temp-cell">' +
      '<div class="bar"><span style="--w:' + lebar.toFixed(1) + "%;--h:" + hue + '"></span></div>' +
      '<span class="temp-val">' + formatSuhu(item.temp) + "</span>" +
      "</div></td>" +
      "</tr>";
  });

  el.body.innerHTML = html;
}


function tampilkanRingkasan(list) {
  let iMax = 0;
  let iMin = 0;
  let total = 0;

  list.forEach((item, i) => {
    if (item.temp > list[iMax].temp) iMax = i;
    if (item.temp < list[iMin].temp) iMin = i;
    total += item.temp;
  });

  const dMax = keDate(list[iMax].time);
  const dMin = keDate(list[iMin].time);

  el.max.textContent = formatSuhu(list[iMax].temp);
  el.maxTime.textContent = formatTanggal(dMax) + ", " + formatJam(dMax);
  el.min.textContent = formatSuhu(list[iMin].temp);
  el.minTime.textContent = formatTanggal(dMin) + ", " + formatJam(dMin);
  el.avg.textContent = formatSuhu(total / list.length);
  el.count.textContent = list.length + " data";

  const awal = keDate(list[0].time);
  const akhir = keDate(list[list.length - 1].time);
  el.rentang.textContent =
    formatTanggal(awal) + " " + formatJam(awal) + " - " + formatTanggal(akhir) + " " + formatJam(akhir) + " GMT";
}


function tampilkanGrafik(list) {
  const W = 640;
  const H = 190;
  const kiri = 10;
  const kanan = 10;
  const atas = 26;
  const bawah = 26;

  const nilai = list.map((d) => d.temp);
  const min = Math.min(...nilai) - 0.5;
  const max = Math.max(...nilai) + 0.5;
  const n = list.length;

  const x = (i) => kiri + (n === 1 ? 0 : (i / (n - 1)) * (W - kiri - kanan));
  const y = (v) => atas + (1 - (v - min) / (max - min)) * (H - atas - bawah);

  let garis = "";
  list.forEach((item, i) => {
    garis += (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(item.temp).toFixed(1) + " ";
  });
  const area = garis + "L" + x(n - 1).toFixed(1) + " " + (H - bawah) + " L" + x(0).toFixed(1) + " " + (H - bawah) + " Z";

  let iMax = 0;
  list.forEach((item, i) => {
    if (item.temp > list[iMax].temp) iMax = i;
  });

  let grid = "";
  for (let g = 0; g < 3; g++) {
    const gy = atas + (g / 2) * (H - atas - bawah);
    grid += '<line class="grid" x1="' + kiri + '" x2="' + (W - kanan) + '" y1="' + gy + '" y2="' + gy + '"/>';
  }

  let titik = "";
  if (n <= 24) {
    list.forEach((item, i) => {
      if (i !== iMax) {
        titik += '<circle class="dot" cx="' + x(i).toFixed(1) + '" cy="' + y(item.temp).toFixed(1) + '" r="3.5"/>';
      }
    });
  }

  const px = x(iMax);
  const py = y(list[iMax].temp);
  const anchor = px < 60 ? "start" : px > W - 60 ? "end" : "middle";

  const dAwal = keDate(list[0].time);
  const dAkhir = keDate(list[n - 1].time);

  el.chart.innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet">' +
    grid +
    '<path class="area" d="' + area + '"/>' +
    '<path class="line" d="' + garis + '"/>' +
    titik +
    '<circle class="peak" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="5.5"/>' +
    '<text class="peak-label" x="' + px.toFixed(1) + '" y="' + (py - 12).toFixed(1) + '" text-anchor="' + anchor + '">' +
    formatSuhu(list[iMax].temp) + "</text>" +
    '<text class="axis" x="' + kiri + '" y="' + (H - 6) + '" text-anchor="start">' + formatJam(dAwal) + "</text>" +
    '<text class="axis" x="' + (W - kanan) + '" y="' + (H - 6) + '" text-anchor="end">' + formatJam(dAkhir) + "</text>" +
    "</svg>";
}

function render() {
  const list = tampilSemua ? semuaData : semuaData.slice(0, JUMLAH_AWAL);

  tampilkanHero();
  tampilkanRingkasan(list);
  tampilkanGrafik(list);
  tampilkanTabel(list);

  el.wrap.classList.toggle("scroll", tampilSemua);
  el.toggle.hidden = false;
  el.toggle.textContent = tampilSemua
    ? "Tampilkan " + JUMLAH_AWAL + " data pertama"
    : "Tampilkan semua (" + semuaData.length + ")";
}


function tampilkanError(pesan) {
  el.body.innerHTML = '<tr><td colspan="2">Data belum tersedia.</td></tr>';
  el.chart.innerHTML = "";
  el.heroTemp.textContent = "--";
  el.heroTime.textContent = "Data tidak tersedia";
  el.notice.hidden = false;
  el.notice.innerHTML =
    "<span>Gagal memuat data (" + pesan + "). Periksa koneksi internet Anda.</span>" +
    '<button class="btn" id="retry" type="button">Coba lagi</button>';
  document.getElementById("retry").addEventListener("click", ambilData);
}


async function ambilData() {
  el.notice.hidden = true;
  el.heroTime.textContent = "Memuat data...";
  tampilkanSkeleton();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const json = await response.json();
    const waktu = json.hourly.time;
    const suhu = json.hourly.temperature_2m;

    semuaData = waktu.map((t, i) => ({ time: t, temp: suhu[i] }));
    render();
  } catch (error) {
    console.error(error);
    tampilkanError(error.message);
  }
}

el.toggle.addEventListener("click", () => {
  tampilSemua = !tampilSemua;
  render();
});

ambilData();
