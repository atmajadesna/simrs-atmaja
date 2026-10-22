/* SIMRS Atmaja — RS Atmaja Wonogiri
 * Demo alur rumah sakit: pendaftaran, antrean, rekam medis, farmasi, kasir.
 * Tanpa pustaka. Seluruh data tersimpan di localStorage perangkat ini.
 */

(() => {
  "use strict";

  /* ============================ data dasar ============================ */

  const POLI = [
    { kode: "A", nama: "Poli Umum", tarif: 25000, dokter: ["dr. Atmaja Pradana", "dr. Sri Lestari"] },
    { kode: "G", nama: "Poli Gigi", tarif: 40000, dokter: ["drg. Retno Wulandari"] },
    { kode: "K", nama: "Poli Anak", tarif: 35000, dokter: ["dr. Bayu Nugroho, Sp.A"] },
    { kode: "D", nama: "Poli Penyakit Dalam", tarif: 50000, dokter: ["dr. Hendra Kusuma, Sp.PD"] },
    { kode: "B", nama: "Poli Kandungan", tarif: 45000, dokter: ["dr. Maya Puspita, Sp.OG"] },
    { kode: "M", nama: "Poli Mata", tarif: 40000, dokter: ["dr. Fajar Setiawan, Sp.M"] },
  ];

  const ICD = [
    { kode: "J06", nama: "Infeksi saluran napas atas akut" },
    { kode: "A09", nama: "Diare dan gastroenteritis" },
    { kode: "K29", nama: "Gastritis" },
    { kode: "I10", nama: "Hipertensi esensial" },
    { kode: "E11", nama: "Diabetes melitus tipe 2" },
    { kode: "M54", nama: "Nyeri punggung" },
    { kode: "K02", nama: "Karies gigi" },
    { kode: "H52", nama: "Kelainan refraksi mata" },
    { kode: "A91", nama: "Demam berdarah dengue" },
    { kode: "J45", nama: "Asma" },
  ];

  const OBAT_AWAL = [
    { kode: "OBT-01", nama: "Paracetamol 500 mg", satuan: "tablet", stok: 140, min: 40, harga: 500 },
    { kode: "OBT-02", nama: "Amoxicillin 500 mg", satuan: "kapsul", stok: 86, min: 30, harga: 1200 },
    { kode: "OBT-03", nama: "Antasida DOEN", satuan: "tablet", stok: 64, min: 25, harga: 400 },
    { kode: "OBT-04", nama: "Salbutamol 2 mg", satuan: "tablet", stok: 22, min: 20, harga: 900 },
    { kode: "OBT-05", nama: "Vitamin C 500 mg", satuan: "tablet", stok: 180, min: 40, harga: 300 },
    { kode: "OBT-06", nama: "Oralit", satuan: "sachet", stok: 12, min: 30, harga: 1500 },
    { kode: "OBT-07", nama: "Amlodipine 5 mg", satuan: "tablet", stok: 58, min: 20, harga: 800 },
    { kode: "OBT-08", nama: "Metformin 500 mg", satuan: "tablet", stok: 74, min: 20, harga: 600 },
  ];

  const KAMAR_AWAL = [
    { nama: "VIP", total: 6, terisi: 4 },
    { nama: "Kelas I", total: 12, terisi: 9 },
    { nama: "Kelas II", total: 18, terisi: 13 },
    { nama: "Kelas III", total: 24, terisi: 21 },
    { nama: "Isolasi", total: 4, terisi: 2 },
  ];

  const PASIEN_AWAL = [
    { nama: "Sutrisno Hadi", nik: "3312011504700001", lahir: "1970-04-15", jk: "L", telp: "081234567801", penjamin: "BPJS" },
    { nama: "Warsini", nik: "3312012207850002", lahir: "1985-07-22", jk: "P", telp: "081234567802", penjamin: "Umum" },
    { nama: "Bagas Prakoso", nik: "3312011010120003", lahir: "2012-10-10", jk: "L", telp: "081234567803", penjamin: "BPJS" },
    { nama: "Retno Palupi", nik: "3312011805900004", lahir: "1990-05-18", jk: "P", telp: "081234567804", penjamin: "Asuransi" },
    { nama: "Joko Susilo", nik: "3312010112680005", lahir: "1968-12-01", jk: "L", telp: "081234567805", penjamin: "BPJS" },
    { nama: "Anisa Rahma", nik: "3312012509010006", lahir: "2001-09-25", jk: "P", telp: "081234567806", penjamin: "Umum" },
  ];

  const KUNCI = "simrs.atmaja.v1";

  /* ============================ bantuan ============================ */

  const rupiah = (n) => "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n));
  const hariISO = (d = new Date()) => d.toISOString().slice(0, 10);

  function umur(lahir) {
    if (!lahir) return null;
    const t = new Date(lahir);
    if (Number.isNaN(t.getTime())) return null;
    const kini = new Date();
    let u = kini.getFullYear() - t.getFullYear();
    const b = kini.getMonth() - t.getMonth();
    if (b < 0 || (b === 0 && kini.getDate() < t.getDate())) u -= 1;
    return u;
  }

  function tanggalIndo(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }

  function jamIndo(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function kabar(teks) {
    const el = document.getElementById("kabar");
    el.textContent = "";
    window.setTimeout(() => { el.textContent = teks; }, 30);
  }

  const el = (id) => document.getElementById(id);

  /* ============================ penyimpanan ============================ */

  function benih() {
    const db = {
      pasien: [],
      kunjungan: [],
      obat: OBAT_AWAL.map((o) => ({ ...o })),
      kamar: KAMAR_AWAL.map((k) => ({ ...k })),
      urut: 1,
    };

    PASIEN_AWAL.forEach((p) => {
      db.pasien.push({ id: "P" + String(db.urut++).padStart(3, "0"), ...p });
    });

    const diagnosaContoh = ["J06", "A09", "K29", "I10", "M54", "K02", "H52", "E11"];
    const poliKode = ["A", "A", "G", "K", "D", "B", "M", "A"];

    // riwayat enam hari ke belakang supaya grafik punya isi nyata
    for (let mundur = 6; mundur >= 1; mundur--) {
      const tanggal = new Date();
      tanggal.setDate(tanggal.getDate() - mundur);
      const jumlah = 5 + ((mundur * 3) % 6);
      for (let i = 0; i < jumlah; i++) {
        const pasien = db.pasien[(mundur + i) % db.pasien.length];
        const poli = POLI.find((p) => p.kode === poliKode[(i + mundur) % poliKode.length]);
        const icd = ICD.find((x) => x.kode === diagnosaContoh[(i + mundur) % diagnosaContoh.length]);
        const jam = String(8 + (i % 8)).padStart(2, "0") + ":" + String((i * 7) % 60).padStart(2, "0");
        const obat = db.obat[(i + mundur) % db.obat.length];
        db.kunjungan.push({
          id: "K" + String(db.urut++).padStart(4, "0"),
          no: `${poli.kode}-${String(i + 1).padStart(3, "0")}`,
          tanggal: hariISO(tanggal),
          waktu: `${hariISO(tanggal)}T${jam}:00`,
          pasienId: pasien.id,
          poliKode: poli.kode,
          dokter: poli.dokter[0],
          penjamin: pasien.penjamin,
          keluhan: "Kontrol rutin",
          status: "selesai",
          rm: {
            keluhan: "Kontrol rutin, keluhan berkurang",
            td: "120/80", nadi: 84, suhu: 36.6, spo2: 98,
            diagnosa: icd.kode,
            resep: [{ kode: obat.kode, jumlah: 10 }],
          },
          diserahkan: true,
          tagihan: { konsultasi: poli.tarif, obat: obat.harga * 10, lunas: true },
        });
      }
    }

    // kunjungan hari ini: campuran status
    const hariIni = hariISO();
    const jadwalHariIni = [
      { poli: "A", status: "selesai", diagnosa: "J06", obat: "OBT-01", jam: "08:10" },
      { poli: "A", status: "selesai", diagnosa: "K29", obat: "OBT-03", jam: "08:35" },
      { poli: "G", status: "dipanggil", diagnosa: null, obat: null, jam: "09:00" },
      { poli: "K", status: "menunggu", diagnosa: null, obat: null, jam: "09:15" },
      { poli: "D", status: "menunggu", diagnosa: null, obat: null, jam: "09:30" },
      { poli: "A", status: "menunggu", diagnosa: null, obat: null, jam: "09:45" },
    ];

    jadwalHariIni.forEach((j, i) => {
      const poli = POLI.find((p) => p.kode === j.poli);
      const pasien = db.pasien[i % db.pasien.length];
      const obat = j.obat ? db.obat.find((o) => o.kode === j.obat) : null;
      const kunjungan = {
        id: "K" + String(db.urut++).padStart(4, "0"),
        no: `${poli.kode}-${String(i + 1).padStart(3, "0")}`,
        tanggal: hariIni,
        waktu: `${hariIni}T${j.jam}:00`,
        pasienId: pasien.id,
        poliKode: poli.kode,
        dokter: poli.dokter[0],
        penjamin: pasien.penjamin,
        keluhan: "Demam dan batuk sejak tiga hari",
        status: j.status,
        rm: j.diagnosa
          ? {
              keluhan: "Demam dan batuk sejak tiga hari",
              td: "118/78", nadi: 92, suhu: 38.1, spo2: 97,
              diagnosa: j.diagnosa,
              resep: [{ kode: obat.kode, jumlah: 10 }],
            }
          : null,
        diserahkan: false,
        tagihan: j.diagnosa
          ? { konsultasi: poli.tarif, obat: obat.harga * 10, lunas: j.status === "selesai" && i % 2 === 0 }
          : null,
      };
      db.kunjungan.push(kunjungan);
    });

    return db;
  }

  function muat() {
    try {
      const mentah = localStorage.getItem(KUNCI);
      if (!mentah) return benih();
      const db = JSON.parse(mentah);
      if (!db || !Array.isArray(db.pasien)) return benih();
      return db;
    } catch {
      return benih();
    }
  }

  let db = muat();

  function simpan() {
    try {
      localStorage.setItem(KUNCI, JSON.stringify(db));
    } catch {
      kabar("Penyimpanan peramban penuh. Data terakhir tidak tersimpan.");
    }
  }

  /* ============================ turunan ============================ */

  const pasienDari = (id) => db.pasien.find((p) => p.id === id);
  const poliDari = (kode) => POLI.find((p) => p.kode === kode);
  const obatDari = (kode) => db.obat.find((o) => o.kode === kode);
  const kunjunganHariIni = () => db.kunjungan.filter((k) => k.tanggal === hariISO());
  const totalTagihan = (t) => (t ? t.konsultasi + t.obat : 0);

  function nomorBaru(poliKode) {
    const hariIni = hariISO();
    const jumlah = db.kunjungan.filter((k) => k.tanggal === hariIni && k.poliKode === poliKode).length;
    return `${poliKode}-${String(jumlah + 1).padStart(3, "0")}`;
  }

  /* ============================ navigasi ============================ */

  const JUDUL = {
    beranda: ["Beranda", "Ringkasan layanan hari ini"],
    pendaftaran: ["Pendaftaran", "Loket pendaftaran pasien rawat jalan"],
    antrean: ["Antrean Poli", "Panggilan dan daftar tunggu per poliklinik"],
    rekam: ["Rekam Medis", "Pemeriksaan, diagnosa, dan resep"],
    farmasi: ["Farmasi", "Stok obat dan penyerahan resep"],
    kasir: ["Kasir", "Tagihan dan pembayaran"],
  };

  let panelAktif = "beranda";

  function bukaPanel(nama) {
    panelAktif = nama;
    document.querySelectorAll(".panel").forEach((p) => {
      p.dataset.tampil = p.dataset.panel === nama ? "ya" : "tidak";
    });
    document.querySelectorAll("#nav button").forEach((b) => {
      if (b.dataset.panel === nama) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    const [judul, sub] = JUDUL[nama];
    el("judul-panel").textContent = judul;
    el("sub-panel").textContent = sub;
    document.querySelector(".utama").scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0, behavior: "instant" });
    gambarSemua();
  }

  document.querySelectorAll("#nav button").forEach((b) => {
    b.addEventListener("click", () => bukaPanel(b.dataset.panel));
  });

  el("reset").addEventListener("click", () => {
    if (!window.confirm("Kembalikan seluruh data contoh ke keadaan awal? Perubahan Anda akan hilang.")) return;
    db = benih();
    simpan();
    gambarSemua();
    kabar("Data contoh dikembalikan ke keadaan awal.");
  });

  /* ============================ beranda ============================ */

  function gambarBeranda() {
    const hariIni = kunjunganHariIni();
    const menunggu = hariIni.filter((k) => k.status === "menunggu" || k.status === "dipanggil");

    el("s-daftar").textContent = String(hariIni.length);
    el("s-menunggu").textContent = String(menunggu.filter((k) => k.status === "menunggu").length);
    el("s-resep").textContent = String(
      hariIni.filter((k) => k.rm && k.rm.resep?.length && !k.diserahkan).length
    );

    const total = db.kamar.reduce((a, k) => a + k.total, 0);
    const terisi = db.kamar.reduce((a, k) => a + k.terisi, 0);
    const persen = total ? Math.round((terisi / total) * 100) : 0;
    el("s-kamar").innerHTML = `${persen}<span class="stat__satuan">%</span>`;
    el("s-kamar-ket").textContent = `${terisi} dari ${total} tempat tidur`;

    // antrean ringkas
    const kotak = el("antrean-ringkas");
    kotak.textContent = "";
    if (!menunggu.length) {
      kotak.innerHTML = '<p class="kartu__ket">Tidak ada pasien menunggu.</p>';
    } else {
      menunggu.slice(0, 6).forEach((k) => {
        const p = pasienDari(k.pasienId);
        const baris = document.createElement("div");
        baris.className = "antrean__baris";
        baris.innerHTML = `
          <span class="antrean__nomor">${k.no}</span>
          <span>
            <span class="antrean__nama">${p ? p.nama : "—"}</span>
            <span class="antrean__poli">${poliDari(k.poliKode).nama} · ${k.dokter}</span>
          </span>
          <span class="chip" data-status="${k.status}">${k.status}</span>`;
        kotak.appendChild(baris);
      });
    }
    el("ket-antrean").textContent = `${menunggu.length} pasien`;

    // per poli
    const daftarPoli = el("poli-ringkas");
    daftarPoli.textContent = "";
    const terbanyak = Math.max(1, ...POLI.map((p) => hariIni.filter((k) => k.poliKode === p.kode).length));
    POLI.forEach((p) => {
      const n = hariIni.filter((k) => k.poliKode === p.kode).length;
      const li = document.createElement("li");
      li.style.display = "grid";
      li.style.gap = "4px";
      li.innerHTML = `
        <span style="display:flex;justify-content:space-between;gap:8px">
          <span>${p.nama}</span><span class="daftar__nilai">${n}</span>
        </span>
        <span class="bar"><span class="bar__isi" style="width:${(n / terbanyak) * 100}%"></span></span>`;
      daftarPoli.appendChild(li);
    });

    // kamar
    const kamarList = el("kamar-list");
    kamarList.textContent = "";
    db.kamar.forEach((k) => {
      const isi = Math.round((k.terisi / k.total) * 100);
      const warna = isi >= 90 ? "merah" : isi >= 75 ? "amber" : "";
      const baris = document.createElement("div");
      baris.style.display = "grid";
      baris.style.gap = "4px";
      baris.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;font-size:var(--text-sm)">
          <span>${k.nama}</span>
          <span class="daftar__nilai">${k.terisi}/${k.total}</span>
        </div>
        <div class="bar"><div class="bar__isi" data-warna="${warna}" style="width:${isi}%"></div></div>`;
      kamarList.appendChild(baris);
    });
    el("ket-kamar").textContent = `${persen}% terpakai`;

    // farmasi
    const rendah = db.obat.filter((o) => o.stok <= o.min);
    const daftarObat = el("farmasi-ringkas");
    daftarObat.textContent = "";
    if (!rendah.length) {
      daftarObat.innerHTML = '<li class="kartu__ket">Semua stok di atas batas minimum.</li>';
    } else {
      rendah.slice(0, 5).forEach((o) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${o.nama}</span><span class="chip" data-status="${o.stok === 0 ? "habis" : "rendah"}">${o.stok} ${o.satuan}</span>`;
        daftarObat.appendChild(li);
      });
    }
    el("ket-farmasi").textContent = `${rendah.length} item`;

    gambarGrafik();
  }

  function gambarGrafik() {
    const kanvas = el("grafik");
    if (!kanvas || !kanvas.clientWidth) return;
    const rasio = window.devicePixelRatio || 1;
    const lebar = kanvas.clientWidth;
    const tinggi = 150;
    kanvas.width = Math.round(lebar * rasio);
    kanvas.height = Math.round(tinggi * rasio);
    const k = kanvas.getContext("2d");
    k.setTransform(rasio, 0, 0, rasio, 0, 0);
    k.clearRect(0, 0, lebar, tinggi);

    const hari = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = hariISO(d);
      hari.push({
        iso,
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        jumlah: db.kunjungan.filter((x) => x.tanggal === iso).length,
      });
    }

    const puncak = Math.max(4, ...hari.map((h) => h.jumlah));
    const kiri = 6;
    const bawah = tinggi - 24;
    const lebarSlot = (lebar - kiri * 2) / hari.length;

    k.strokeStyle = "rgba(25,32,45,0.10)";
    k.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = bawah - (bawah - 12) * (i / 4);
      k.beginPath();
      k.moveTo(kiri, y);
      k.lineTo(lebar - kiri, y);
      k.stroke();
    }

    hari.forEach((h, i) => {
      const tinggiBar = ((bawah - 12) * h.jumlah) / puncak;
      const x = kiri + i * lebarSlot + lebarSlot * 0.18;
      const w = lebarSlot * 0.64;
      const y = bawah - tinggiBar;
      k.fillStyle = h.iso === hariISO() ? "oklch(45% 0.09 195)" : "oklch(45% 0.09 195 / 0.35)";
      k.beginPath();
      const r = 3;
      k.moveTo(x, bawah);
      k.lineTo(x, y + r);
      k.quadraticCurveTo(x, y, x + r, y);
      k.lineTo(x + w - r, y);
      k.quadraticCurveTo(x + w, y, x + w, y + r);
      k.lineTo(x + w, bawah);
      k.closePath();
      k.fill();

      k.fillStyle = "oklch(42% 0.018 245)";
      k.font = "500 10px 'JetBrains Mono', monospace";
      k.textAlign = "center";
      k.fillText(String(h.jumlah), x + w / 2, y - 5);
      k.fillStyle = "oklch(58% 0.015 245)";
      k.fillText(h.label, x + w / 2, tinggi - 6);
    });
  }

  /* ============================ pendaftaran ============================ */

  function isiPilihanPoli() {
    const pilihan = el("f-poli");
    pilihan.textContent = "";
    POLI.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.kode;
      o.textContent = `${p.nama} · ${rupiah(p.tarif)}`;
      pilihan.appendChild(o);
    });
    isiPilihanDokter();

    const saring = el("filter-poli");
    saring.textContent = "";
    const semua = document.createElement("option");
    semua.value = "";
    semua.textContent = "Semua poli";
    saring.appendChild(semua);
    POLI.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.kode;
      o.textContent = p.nama;
      saring.appendChild(o);
    });
  }

  function isiPilihanDokter() {
    const kode = el("f-poli").value;
    const poli = poliDari(kode);
    const pilihan = el("f-dokter");
    pilihan.textContent = "";
    poli.dokter.forEach((d) => {
      const o = document.createElement("option");
      o.value = d;
      o.textContent = d;
      pilihan.appendChild(o);
    });
  }

  el("f-poli").addEventListener("change", isiPilihanDokter);

  function galat(id, pesan) {
    const p = el(id);
    p.textContent = pesan || "";
    p.hidden = !pesan;
  }

  el("borang-daftar").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = el("f-nama").value.trim();
    const nik = el("f-nik").value.replace(/\D/g, "");
    const lahir = el("f-lahir").value;
    const jk = el("f-jk").value;
    const telp = el("f-telp").value.trim();
    const penjamin = el("f-penjamin").value;
    const poliKode = el("f-poli").value;
    const dokter = el("f-dokter").value;
    const keluhan = el("f-keluhan").value.trim();

    let sah = true;
    galat("e-nama", "");
    galat("e-nik", "");

    if (nama.length < 3) {
      galat("e-nama", "Nama minimal tiga huruf.");
      sah = false;
    }
    if (nik && nik.length !== 16) {
      galat("e-nik", "NIK harus 16 angka.");
      sah = false;
    }
    if (!sah) return;

    let pasien = nik ? db.pasien.find((p) => p.nik === nik) : null;
    if (!pasien) {
      pasien = {
        id: "P" + String(db.urut++).padStart(3, "0"),
        nama, nik, lahir, jk, telp, penjamin,
      };
      db.pasien.push(pasien);
    }

    const poli = poliDari(poliKode);
    const kunjungan = {
      id: "K" + String(db.urut++).padStart(4, "0"),
      no: nomorBaru(poliKode),
      tanggal: hariISO(),
      waktu: new Date().toISOString(),
      pasienId: pasien.id,
      poliKode,
      dokter,
      penjamin,
      keluhan,
      status: "menunggu",
      rm: null,
      diserahkan: false,
      tagihan: null,
    };
    db.kunjungan.push(kunjungan);
    simpan();

    el("kartu-tiket").hidden = false;
    el("tiket-nomor").textContent = kunjungan.no;
    el("tiket-waktu").textContent = jamIndo(kunjungan.waktu) + " WIB";
    el("tiket-rinci").innerHTML = `
      <li><span>Nama</span><span class="daftar__nilai">${pasien.nama}</span></li>
      <li><span>Poli</span><span class="daftar__nilai">${poli.nama}</span></li>
      <li><span>Dokter</span><span class="daftar__nilai">${dokter}</span></li>
      <li><span>Penjamin</span><span class="daftar__nilai">${penjamin}</span></li>`;

    el("borang-daftar").reset();
    isiPilihanDokter();
    gambarSemua();
    kabar(`Terdaftar. Nomor antrean ${kunjungan.no}.`);
  });

  el("tiket-antrean").addEventListener("click", () => bukaPanel("antrean"));
  el("tiket-cetak").addEventListener("click", () => window.print());

  function gambarTerdaftar() {
    const isi = el("tabel-terdaftar");
    isi.textContent = "";
    const hariIni = kunjunganHariIni();
    el("ket-terdaftar").textContent = `${hariIni.length} pasien`;

    if (!hariIni.length) {
      isi.innerHTML = '<tr><td colspan="5">Belum ada pendaftaran hari ini.</td></tr>';
      return;
    }

    hariIni.forEach((k) => {
      const p = pasienDari(k.pasienId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="kuat" style="font-family:var(--font-mono)">${k.no}</td>
        <td class="kuat">${p ? p.nama : "—"}</td>
        <td>${poliDari(k.poliKode).nama}</td>
        <td>${k.penjamin}</td>
        <td class="angka">${umur(p?.lahir) ?? "—"}</td>`;
      isi.appendChild(tr);
    });
  }

  /* ============================ antrean ============================ */

  function gambarAntrean() {
    const saring = el("filter-poli").value;
    const hariIni = kunjunganHariIni().filter((k) => (saring ? k.poliKode === saring : true));
    const aktif = hariIni.filter((k) => k.status === "menunggu" || k.status === "dipanggil");

    const papan = el("papan-antrean");
    papan.textContent = "";
    if (!aktif.length) {
      papan.innerHTML = '<div class="kosong"><span>Tidak ada antrean aktif untuk saringan ini.</span></div>';
    } else {
      aktif.forEach((k) => {
        const p = pasienDari(k.pasienId);
        const tiket = document.createElement("div");
        tiket.className = "tiket";
        tiket.dataset.status = k.status;
        tiket.innerHTML = `
          <span class="tiket__nomor">${k.no}</span>
          <span class="tiket__nama">${p ? p.nama : "—"}</span>
          <span class="tiket__meta">${poliDari(k.poliKode).nama}</span>
          <span class="chip" data-status="${k.status}">${k.status}</span>`;
        papan.appendChild(tiket);
      });
    }

    const tabel = el("tabel-antrean");
    tabel.textContent = "";
    el("ket-tunggu").textContent = `${aktif.length} menunggu`;

    if (!aktif.length) {
      tabel.innerHTML = '<tr><td colspan="6">Antrean kosong.</td></tr>';
      return;
    }

    aktif.forEach((k) => {
      const p = pasienDari(k.pasienId);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="kuat" style="font-family:var(--font-mono)">${k.no}</td>
        <td class="kuat">${p ? p.nama : "—"}</td>
        <td>${poliDari(k.poliKode).nama}</td>
        <td>${k.dokter}</td>
        <td><span class="chip" data-status="${k.status}">${k.status}</span></td>
        <td></td>`;
      const sel = tr.lastElementChild;

      if (k.status === "menunggu") {
        const b = document.createElement("button");
        b.className = "tombol tombol--sunyi tombol--kecil";
        b.type = "button";
        b.textContent = "Panggil";
        b.addEventListener("click", () => {
          k.status = "dipanggil";
          simpan();
          gambarSemua();
          kabar(`${k.no} dipanggil ke ${poliDari(k.poliKode).nama}.`);
        });
        sel.appendChild(b);
      } else {
        const b = document.createElement("button");
        b.className = "tombol tombol--kecil";
        b.type = "button";
        b.textContent = "Periksa";
        b.addEventListener("click", () => {
          pasienRekam = k.id;
          bukaPanel("rekam");
        });
        sel.appendChild(b);
      }

      const batal = document.createElement("button");
      batal.className = "tombol tombol--sunyi tombol--kecil";
      batal.type = "button";
      batal.textContent = "Batal";
      batal.style.marginLeft = "6px";
      batal.addEventListener("click", () => {
        k.status = "batal";
        simpan();
        gambarSemua();
        kabar(`Antrean ${k.no} dibatalkan.`);
      });
      sel.appendChild(batal);

      tabel.appendChild(tr);
    });
  }

  el("filter-poli").addEventListener("change", gambarAntrean);

  el("panggil-berikut").addEventListener("click", () => {
    const berikut = kunjunganHariIni().find((k) => k.status === "menunggu");
    if (!berikut) {
      kabar("Tidak ada pasien menunggu.");
      return;
    }
    berikut.status = "dipanggil";
    simpan();
    gambarSemua();
    kabar(`Memanggil ${berikut.no} — ${pasienDari(berikut.pasienId)?.nama ?? ""}.`);
  });

  /* ============================ rekam medis ============================ */

  let pasienRekam = null;
  let resepDraft = [];

  function isiPilihanDiagnosa() {
    const pilihan = el("r-diagnosa");
    pilihan.textContent = "";
    const kosong = document.createElement("option");
    kosong.value = "";
    kosong.textContent = "Pilih diagnosa";
    pilihan.appendChild(kosong);
    ICD.forEach((d) => {
      const o = document.createElement("option");
      o.value = d.kode;
      o.textContent = `${d.kode} · ${d.nama}`;
      pilihan.appendChild(o);
    });
  }

  function isiPilihanObat() {
    const pilihan = el("r-obat");
    pilihan.textContent = "";
    db.obat.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.kode;
      opt.textContent = `${o.nama} · stok ${o.stok}`;
      pilihan.appendChild(opt);
    });
  }

  function gambarDaftarRekam() {
    const kotak = el("daftar-rekam");
    kotak.textContent = "";
    const aktif = kunjunganHariIni().filter((k) => k.status === "menunggu" || k.status === "dipanggil");
    el("ket-rekam").textContent = `${aktif.length} pasien`;

    if (!aktif.length) {
      kotak.innerHTML = '<p class="kartu__ket">Tidak ada pasien menunggu pemeriksaan.</p>';
      return;
    }

    aktif.forEach((k) => {
      const p = pasienDari(k.pasienId);
      const tombol = document.createElement("button");
      tombol.type = "button";
      tombol.className = "antrean__baris";
      tombol.style.textAlign = "left";
      tombol.style.cursor = "pointer";
      tombol.innerHTML = `
        <span class="antrean__nomor">${k.no}</span>
        <span>
          <span class="antrean__nama">${p ? p.nama : "—"}</span>
          <span class="antrean__poli">${poliDari(k.poliKode).nama} · ${umur(p?.lahir) ?? "—"} th</span>
        </span>
        <span class="chip" data-status="${k.status}">${k.status}</span>`;
      if (k.id === pasienRekam) {
        tombol.style.borderColor = "var(--teal)";
        tombol.style.background = "var(--teal-soft)";
      }
      tombol.addEventListener("click", () => {
        pasienRekam = k.id;
        resepDraft = [];
        gambarRekam();
      });
      kotak.appendChild(tombol);
    });
  }

  function gambarRekam() {
    gambarDaftarRekam();
    const k = db.kunjungan.find((x) => x.id === pasienRekam);
    if (!k) {
      el("r-nama").textContent = "Belum ada pasien dipilih";
      el("r-meta").textContent = "Pilih dari daftar di samping";
      el("r-avatar").textContent = "—";
      el("tabel-riwayat").innerHTML = '<tr><td colspan="4">—</td></tr>';
      el("ket-riwayat").textContent = "—";
      return;
    }
    const p = pasienDari(k.pasienId);
    el("r-avatar").textContent = p.nama.slice(0, 1).toUpperCase();
    el("r-nama").textContent = p.nama;
    el("r-meta").textContent = `${k.no} · ${poliDari(k.poliKode).nama} · ${umur(p.lahir) ?? "—"} tahun · ${p.jk === "L" ? "laki-laki" : "perempuan"} · ${k.penjamin}`;
    el("r-keluhan").value = k.keluhan || "";

    if (!el("r-diagnosa").options.length) isiPilihanDiagnosa();
    if (!el("r-obat").options.length) isiPilihanObat();
    gambarResep();

    const riwayat = db.kunjungan
      .filter((x) => x.pasienId === k.pasienId && x.id !== k.id)
      .slice(-5)
      .reverse();
    const isi = el("tabel-riwayat");
    isi.textContent = "";
    el("ket-riwayat").textContent = `${riwayat.length} catatan`;
    if (!riwayat.length) {
      isi.innerHTML = '<tr><td colspan="4">Belum ada riwayat sebelumnya.</td></tr>';
    } else {
      riwayat.forEach((r) => {
        const icd = ICD.find((d) => d.kode === r.rm?.diagnosa);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-family:var(--font-mono)">${tanggalIndo(r.tanggal)}</td>
          <td>${poliDari(r.poliKode).nama}</td>
          <td>${icd ? icd.nama : "—"}</td>
          <td>${r.dokter}</td>`;
        isi.appendChild(tr);
      });
    }
  }

  function gambarResep() {
    const daftar = el("daftar-resep");
    daftar.textContent = "";
    if (!resepDraft.length) {
      daftar.innerHTML = '<li class="kartu__ket">Belum ada obat di resep.</li>';
      return;
    }
    resepDraft.forEach((r, i) => {
      const o = obatDari(r.kode);
      const li = document.createElement("li");
      li.innerHTML = `<span>${o.nama} · ${r.jumlah} ${o.satuan}</span>`;
      const hapus = document.createElement("button");
      hapus.type = "button";
      hapus.className = "tombol tombol--sunyi tombol--kecil";
      hapus.textContent = "Hapus";
      hapus.addEventListener("click", () => {
        resepDraft.splice(i, 1);
        gambarResep();
      });
      li.appendChild(hapus);
      daftar.appendChild(li);
    });
  }

  el("tambah-obat").addEventListener("click", () => {
    const kode = el("r-obat").value;
    const jumlah = Math.max(1, Number(el("r-jumlah").value) || 1);
    const obat = obatDari(kode);
    if (obat.stok < jumlah) {
      kabar(`Stok ${obat.nama} hanya ${obat.stok} ${obat.satuan}.`);
      return;
    }
    const ada = resepDraft.find((r) => r.kode === kode);
    if (ada) ada.jumlah += jumlah;
    else resepDraft.push({ kode, jumlah });
    gambarResep();
    kabar(`${obat.nama} ditambahkan ke resep.`);
  });

  el("borang-rekam").addEventListener("submit", (e) => {
    e.preventDefault();
    const k = db.kunjungan.find((x) => x.id === pasienRekam);
    if (!k) {
      kabar("Pilih pasien lebih dulu.");
      return;
    }
    const diagnosa = el("r-diagnosa").value;
    if (!diagnosa) {
      kabar("Diagnosa belum dipilih.");
      el("r-diagnosa").focus();
      return;
    }
    if (!resepDraft.length) {
      kabar("Resep masih kosong. Tambahkan minimal satu obat.");
      return;
    }

    const poli = poliDari(k.poliKode);
    const biayaObat = resepDraft.reduce((a, r) => a + obatDari(r.kode).harga * r.jumlah, 0);

    k.rm = {
      keluhan: el("r-keluhan").value.trim(),
      td: el("v-td").value.trim() || "—",
      nadi: Number(el("v-nadi").value) || null,
      suhu: Number(el("v-suhu").value) || null,
      spo2: Number(el("v-spo2").value) || null,
      diagnosa,
      resep: resepDraft.map((r) => ({ ...r })),
    };
    k.status = "selesai";
    k.tanggal = hariISO();
    k.tagihan = { konsultasi: poli.tarif, obat: biayaObat, lunas: false };

    simpan();
    resepDraft = [];
    pasienRekam = null;
    el("borang-rekam").reset();
    gambarSemua();
    kabar("Rekam medis tersimpan. Tagihan dibuat di kasir.");
  });

  /* ============================ farmasi ============================ */

  function statusStok(o) {
    if (o.stok === 0) return ["habis", "habis"];
    if (o.stok <= o.min) return ["rendah", "perlu tambah"];
    return ["tersedia", "aman"];
  }

  function gambarFarmasi() {
    const tabel = el("tabel-obat");
    tabel.textContent = "";
    const perlu = db.obat.filter((o) => o.stok <= o.min).length;
    el("ket-obat").textContent = `${db.obat.length} item · ${perlu} perlu tambah`;

    db.obat.forEach((o) => {
      const [status, label] = statusStok(o);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family:var(--font-mono)">${o.kode}</td>
        <td class="kuat">${o.nama}</td>
        <td>${o.satuan}</td>
        <td class="angka">${o.stok}</td>
        <td class="angka">${o.min}</td>
        <td><span class="chip" data-status="${status}">${label}</span></td>
        <td></td>`;
      const sel = tr.lastElementChild;
      const tambah = document.createElement("button");
      tambah.type = "button";
      tambah.className = "tombol tombol--sunyi tombol--kecil";
      tambah.textContent = "+20";
      tambah.addEventListener("click", () => {
        o.stok += 20;
        simpan();
        gambarSemua();
        kabar(`Stok ${o.nama} menjadi ${o.stok} ${o.satuan}.`);
      });
      sel.appendChild(tambah);
      tabel.appendChild(tr);
    });

    const tabelResep = el("tabel-resep");
    tabelResep.textContent = "";
    const menunggu = kunjunganHariIni().filter((k) => k.rm?.resep?.length && !k.diserahkan);
    el("ket-resep").textContent = `${menunggu.length} resep`;

    if (!menunggu.length) {
      tabelResep.innerHTML = '<tr><td colspan="5">Tidak ada resep menunggu.</td></tr>';
      return;
    }

    menunggu.forEach((k) => {
      const p = pasienDari(k.pasienId);
      k.rm.resep.forEach((r, i) => {
        const o = obatDari(r.kode);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-family:var(--font-mono)">${i === 0 ? k.no : ""}</td>
          <td>${i === 0 ? (p ? p.nama : "—") : ""}</td>
          <td class="kuat">${o.nama}</td>
          <td class="angka">${r.jumlah} ${o.satuan}</td>
          <td></td>`;
        if (i === 0) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "tombol tombol--kecil";
          b.textContent = "Serahkan";
          b.addEventListener("click", () => {
            const kurang = k.rm.resep.find((x) => obatDari(x.kode).stok < x.jumlah);
            if (kurang) {
              kabar(`Stok ${obatDari(kurang.kode).nama} tidak cukup.`);
              return;
            }
            k.rm.resep.forEach((x) => { obatDari(x.kode).stok -= x.jumlah; });
            k.diserahkan = true;
            simpan();
            gambarSemua();
            kabar(`Resep ${k.no} diserahkan, stok dikurangi.`);
          });
          tr.lastElementChild.appendChild(b);
        }
        tabelResep.appendChild(tr);
      });
    });
  }

  /* ============================ kasir ============================ */

  let kasirAktif = null;

  function gambarKasir() {
    const kotak = el("daftar-kasir");
    kotak.textContent = "";
    const belum = db.kunjungan.filter((k) => k.tagihan && !k.tagihan.lunas);
    el("ket-kasir").textContent = `${belum.length} tagihan`;

    if (!belum.length) {
      kotak.innerHTML = '<p class="kartu__ket">Semua tagihan sudah dibayar.</p>';
      el("tagihan-isi").innerHTML = `
        <div class="kosong">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>
          <span>Tidak ada tagihan terbuka.</span>
        </div>`;
      el("tagihan-nomor").textContent = "—";
      return;
    }

    belum.forEach((k) => {
      const p = pasienDari(k.pasienId);
      const tombol = document.createElement("button");
      tombol.type = "button";
      tombol.className = "antrean__baris";
      tombol.style.textAlign = "left";
      tombol.style.cursor = "pointer";
      if (k.id === kasirAktif) {
        tombol.style.borderColor = "var(--teal)";
        tombol.style.background = "var(--teal-soft)";
      }
      tombol.innerHTML = `
        <span class="antrean__nomor">${k.no}</span>
        <span>
          <span class="antrean__nama">${p ? p.nama : "—"}</span>
          <span class="antrean__poli">${poliDari(k.poliKode).nama} · ${k.penjamin}</span>
        </span>
        <span class="daftar__nilai">${k.penjamin === "BPJS" ? "ditanggung" : rupiah(totalTagihan(k.tagihan))}</span>`;
      tombol.addEventListener("click", () => {
        kasirAktif = k.id;
        gambarKasir();
      });
      kotak.appendChild(tombol);
    });

    if (!kasirAktif || !belum.some((k) => k.id === kasirAktif)) kasirAktif = belum[0].id;
    gambarTagihan();
  }

  function gambarTagihan() {
    const k = db.kunjungan.find((x) => x.id === kasirAktif);
    if (!k || !k.tagihan) return;
    const p = pasienDari(k.pasienId);
    const poli = poliDari(k.poliKode);
    const total = totalTagihan(k.tagihan);
    const ditanggung = k.penjamin === "BPJS";
    const bayar = ditanggung ? 0 : k.penjamin === "Asuransi" ? Math.round(total * 0.2) : total;

    el("tagihan-nomor").textContent = `${k.no} · ${jamIndo(k.waktu)}`;
    el("tagihan-isi").innerHTML = `
      <div style="display:grid;gap:10px">
        <div>
          <p class="rekam__nama">${p ? p.nama : "—"}</p>
          <p class="rekam__meta">${poli.nama} · ${k.dokter} · ${k.penjamin}</p>
        </div>
        <div class="tagihan">
          <div class="tagihan__baris"><span>Konsultasi ${poli.nama}</span><span>${rupiah(k.tagihan.konsultasi)}</span></div>
          ${(k.rm?.resep || []).map((r) => {
            const o = obatDari(r.kode);
            return `<div class="tagihan__baris"><span>${o.nama} × ${r.jumlah}</span><span>${rupiah(o.harga * r.jumlah)}</span></div>`;
          }).join("")}
          <div class="tagihan__baris"><span>Subtotal</span><span>${rupiah(total)}</span></div>
          ${ditanggung ? `<div class="tagihan__baris"><span>Ditanggung BPJS Kesehatan</span><span>− ${rupiah(total)}</span></div>` : ""}
          ${k.penjamin === "Asuransi" ? `<div class="tagihan__baris"><span>Ditanggung asuransi (80%)</span><span>− ${rupiah(total - bayar)}</span></div>` : ""}
        </div>
        <div class="tagihan__total"><span>Yang dibayar pasien</span><strong>${rupiah(bayar)}</strong></div>
        <div class="baris-tombol">
          <button class="tombol" type="button" id="bayar">${bayar === 0 ? "Tandai selesai" : "Terima pembayaran"}</button>
          <button class="tombol tombol--sunyi" type="button" id="struk">Cetak struk</button>
        </div>
        <p class="bantuan">Simulasi penjaminan: BPJS menanggung penuh, asuransi swasta 80%, umum membayar penuh.</p>
      </div>`;

    el("bayar").addEventListener("click", () => {
      k.tagihan.lunas = true;
      simpan();
      gambarSemua();
      kabar(`Tagihan ${k.no} lunas.`);
    });

    el("struk").addEventListener("click", () => window.print());
  }

  /* ============================ render semua ============================ */

  function lencanaAntrean() {
    const n = kunjunganHariIni().filter((k) => k.status === "menunggu").length;
    const l = el("lencana-antrean");
    l.textContent = String(n);
    l.hidden = n === 0;
  }

  function gambarSemua() {
    const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const waktu = document.getElementById("waktu-data");
    if (waktu) waktu.textContent = `diperbarui ${jam} WIB`;
    lencanaAntrean();
    if (panelAktif === "beranda") gambarBeranda();
    if (panelAktif === "pendaftaran") gambarTerdaftar();
    if (panelAktif === "antrean") gambarAntrean();
    if (panelAktif === "rekam") gambarRekam();
    if (panelAktif === "farmasi") gambarFarmasi();
    if (panelAktif === "kasir") gambarKasir();
  }

  /* ============================ mulai ============================ */

  document.getElementById("buka-farmasi")?.addEventListener("click", () => bukaPanel("farmasi"));

  isiPilihanPoli();
  isiPilihanDiagnosa();
  isiPilihanObat();
  gambarSemua();

  window.addEventListener("resize", () => {
    if (panelAktif === "beranda") gambarGrafik();
  });
})();
