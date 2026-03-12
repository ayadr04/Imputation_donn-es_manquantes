import { useState } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,400&display=swap');`;

const BASE_DATA = [
  { id: 1, age: 23, salaire: 2800, experience: 1, score: 72 },
  { id: 2, age: 31, salaire: null, experience: 5, score: 85 },
  { id: 3, age: null, salaire: 4200, experience: 8, score: null },
  { id: 4, age: 45, salaire: 5500, experience: 15, score: 91 },
  { id: 5, age: null, salaire: 3100, experience: null, score: 68 },
  { id: 6, age: 38, salaire: null, experience: 10, score: 79 },
  { id: 7, age: 27, salaire: 3400, experience: 3, score: null },
  { id: 8, age: 52, salaire: 6200, experience: 20, score: 95 },
  { id: 9, age: null, salaire: null, experience: 7, score: 77 },
  { id: 10, age: 34, salaire: 4800, experience: 9, score: 83 },
];

const METHODS = [
  { key: "none", label: "Données brutes", color: "#e74c3c", icon: "⚠️" },
  { key: "mean", label: "Moyenne", color: "#3498db", icon: "μ" },
  { key: "median", label: "Médiane", color: "#9b59b6", icon: "M" },
  { key: "mode", label: "Mode", color: "#e67e22", icon: "Mo" },
  { key: "knn", label: "K-NN", color: "#27ae60", icon: "K" },
  { key: "mice", label: "MICE", color: "#e74c3c", icon: "∞" },
  { key: "interpolation", label: "Interpolation Lin.", color: "#f39c12", icon: "∿" },
  { key: "listwise", label: "Suppression", color: "#95a5a6", icon: "✕" },
];

const METHOD_DESCS = {
  none: "Les valeurs manquantes sont représentées telles quelles. Aucune modification n'est apportée.",
  mean: "Chaque valeur manquante est remplacée par la moyenne des valeurs existantes. Simple mais peut réduire la variance.",
  median: "Remplacement par la valeur centrale. Robuste aux valeurs extrêmes (outliers).",
  mode: "Remplacement par la valeur la plus fréquente. Adapté aux données discrètes ou catégorielles.",
  knn: "Les k=3 observations les plus proches (selon les autres variables) estiment la valeur manquante.",
  mice: "Algorithme itératif : chaque variable manquante est imputée par régression sur toutes les autres, répété jusqu'à convergence.",
  interpolation: "Comble les valeurs manquantes en traçant une droite entre la valeur précédente et la suivante (ordre des lignes).",
  listwise: "Les lignes contenant au moins une valeur manquante sont supprimées. Peut entraîner une perte d'information.",
};

const METHOD_PROS = {
  none: [],
  mean: ["Très simple", "Rapide"],
  median: ["Robuste aux outliers", "Intuitif"],
  mode: ["Bon pour catégories", "Conserve la distribution"],
  knn: ["Préserve la structure", "Non paramétrique"],
  mice: ["Gère plusieurs variables", "Robuste MAR", "Préserve les distributions"],
  interpolation: ["Respecte la tendance locale", "Intuitif sur séries temporelles"],
  listwise: ["Aucun biais d'imputation", "Données complètes"],
};

const METHOD_CONS = {
  none: ["Analyses impossibles"],
  mean: ["Réduit la variance", "Ignore les corrélations"],
  median: ["Réduit la variance", "Ignore les corrélations"],
  mode: ["Crée des pics artificiels"],
  knn: ["Lent sur grands datasets", "Sensible à l'échelle"],
  mice: ["Plus lent", "Complexe à interpréter"],
  interpolation: ["Dépend de l'ordre des données", "Mauvais si non séquentiel"],
  listwise: ["Perte de données", "Biais si non-MCAR"],
};

function calcMean(arr) {
  const v = arr.filter(x => x !== null);
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function calcMedian(arr) {
  const v = arr.filter(x => x !== null).sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 0 ? (v[m - 1] + v[m]) / 2 : v[m];
}
function calcMode(arr) {
  const v = arr.filter(x => x !== null);
  const freq = {};
  v.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
  return +Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
}
function knnImpute(data, col, k) {
  k = k || 3;
  return data.map(function (row) {
    if (row[col] !== null) return Object.assign({}, row);
    var others = data.filter(function (r) { return r[col] !== null; });
    var dists = others.map(function (o) {
      var cols = ["age", "salaire", "experience", "score"];
      var d = 0, count = 0;
      cols.forEach(function (c) {
        if (c !== col && row[c] !== null && o[c] !== null) {
          var vals = data.filter(function (x) { return x[c] !== null; }).map(function (x) { return x[c]; });
          var rng = Math.max.apply(null, vals) - Math.min.apply(null, vals);
          d += Math.pow((row[c] - o[c]) / (rng || 1), 2);
          count++;
        }
      });
      return { val: o[col], dist: count > 0 ? Math.sqrt(d) : 999 };
    });
    var nearest = dists.sort(function (a, b) { return a.dist - b.dist; }).slice(0, k);
    var result = Object.assign({}, row);
    result[col] = Math.round(nearest.reduce(function (s, n) { return s + n.val; }, 0) / nearest.length);
    return result;
  });
}
function miceImpute(data, col) {
  // Simplified MICE: iterative regression using all available columns
  var cols = ["age", "salaire", "experience", "score"];
  var result = data.map(function (r) { return Object.assign({}, r); });
  // Initialize missing with mean
  var colVals = result.map(function (r) { return r[col]; }).filter(function (v) { return v !== null; });
  var initMean = calcMean(colVals);
  result.forEach(function (r) { if (r[col] === null) r[col] = initMean; });
  // 3 iterations
  for (var iter = 0; iter < 3; iter++) {
    var orig = data.map(function (r) { return r[col]; });
    result.forEach(function (row, i) {
      if (orig[i] !== null) return;
      var predictors = cols.filter(function (c) { return c !== col; });
      var valid = result.filter(function (r2) { return predictors.every(function (p) { return r2[p] !== null; }) && orig[result.indexOf(r2)] !== null; });
      if (valid.length < 2) return;
      // Multi-feature weighted regression approximation
      var xm = {}, ym = calcMean(valid.map(function (r2) { return r2[col]; }));
      predictors.forEach(function (p) { xm[p] = calcMean(valid.map(function (r2) { return r2[p]; })); });
      var num = {}, den = {};
      predictors.forEach(function (p) { num[p] = 0; den[p] = 0; });
      valid.forEach(function (r2) {
        predictors.forEach(function (p) {
          num[p] += (r2[p] - xm[p]) * (r2[col] - ym);
          den[p] += Math.pow(r2[p] - xm[p], 2);
        });
      });
      var pred = ym;
      predictors.forEach(function (p) {
        if (den[p] > 0 && row[p] !== null) pred += (num[p] / den[p]) * (row[p] - xm[p]);
      });
      row[col] = Math.round(pred);
    });
  }
  return result;
}
function interpolationImpute(data, col) {
  var result = data.map(function (r) { return Object.assign({}, r); });
  for (var i = 0; i < result.length; i++) {
    if (result[i][col] === null) {
      var prev = -1, next = -1;
      for (var j = i - 1; j >= 0; j--) { if (result[j][col] !== null) { prev = j; break; } }
      for (var k = i + 1; k < result.length; k++) { if (result[k][col] !== null) { next = k; break; } }
      if (prev !== -1 && next !== -1) {
        var t = (i - prev) / (next - prev);
        result[i][col] = Math.round(result[prev][col] + t * (result[next][col] - result[prev][col]));
      } else if (prev !== -1) {
        result[i][col] = result[prev][col];
      } else if (next !== -1) {
        result[i][col] = result[next][col];
      }
    }
  }
  return result;
}
function applyMethod(method, col) {
  if (method === "none") return BASE_DATA;
  if (method === "listwise") return BASE_DATA.filter(function (r) { return r[col] !== null; });
  var cd = BASE_DATA.map(function (r) { return r[col]; });
  if (method === "mean") return BASE_DATA.map(function (r) { var o = Object.assign({}, r); if (o[col] === null) o[col] = Math.round(calcMean(cd)); return o; });
  if (method === "median") return BASE_DATA.map(function (r) { var o = Object.assign({}, r); if (o[col] === null) o[col] = Math.round(calcMedian(cd)); return o; });
  if (method === "mode") return BASE_DATA.map(function (r) { var o = Object.assign({}, r); if (o[col] === null) o[col] = calcMode(cd); return o; });
  if (method === "knn") return knnImpute(BASE_DATA, col);
  if (method === "mice") return miceImpute(BASE_DATA, col);
  if (method === "interpolation") return interpolationImpute(BASE_DATA, col);
  return BASE_DATA;
}

function MiniBar({ data, col, color }) {
  const vals = data.map(r => r[col]);
  const nonNull = vals.filter(v => v !== null);
  const max = Math.max(...nonNull), min = Math.min(...nonNull);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60, padding: "8px 0" }}>
      {vals.map((v, i) => {
        const wasNull = BASE_DATA[i] && BASE_DATA[i][col] === null;
        const imputed = wasNull && v !== null;
        const missing = v === null;
        const h = missing ? 4 : Math.max(4, ((v - min) / (max - min || 1)) * 52);
        return (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              width: "100%", height: h,
              background: missing ? "#e8eaf0" : imputed ? color : "#b0b8cc",
              borderRadius: 2,
              border: imputed ? ("1px solid " + color) : "none",
              transition: "all 0.4s ease",
              opacity: missing ? 0.5 : 1,
            }} title={"ID " + (i + 1) + ": " + (v === null ? "manquant" : v)} />
          </div>
        );
      })}
    </div>
  );
}

function StatsPill({ label, value, color }) {
  return (
    <div style={{
      background: "#f8f9fd", border: ("1px solid " + color + "40"),
      borderRadius: 8, padding: "6px 12px", display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ color: "#8892b0", fontSize: 10, fontFamily: "DM Mono", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ color: color, fontSize: 14, fontFamily: "DM Mono", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function ImputationApp() {
  const [tab, setTab] = useState("demo");
  const [selectedMethod, setSelectedMethod] = useState("none");
  const [selectedCol, setSelectedCol] = useState("salaire");
  const [animating, setAnimating] = useState(false);

  const method = METHODS.find(m => m.key === selectedMethod);
  const imputedData = applyMethod(selectedMethod, selectedCol);
  const colData = imputedData.map(r => r[selectedCol]).filter(v => v !== null);
  const origMissing = BASE_DATA.filter(r => r[selectedCol] === null).length;
  const imputedCount = selectedMethod === "listwise" ? 0 : origMissing;

  const stdDev = (arr) => {
    if (arr.length < 2) return "—";
    const m = calcMean(arr);
    return Math.round(Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1)));
  };

  const handleMethod = (key) => {
    setAnimating(true);
    setTimeout(() => { setSelectedMethod(key); setAnimating(false); }, 180);
  };

  const btnStyle = (active, color) => ({
    background: active ? (color || "#1a1a2e") : "#f0f2f8",
    color: active ? "#fff" : "#555",
    border: "1px solid " + (active ? (color || "#1a1a2e") : "#dde1ef"),
    borderRadius: 6, padding: "6px 14px", cursor: "pointer",
    fontFamily: "DM Mono", fontSize: 12, transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", color: "#1a1a2e", fontFamily: "DM Mono, monospace" }}>
      <style>{FONT}</style>

      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f2f8 100%)",
        borderBottom: "1px solid #dde1ef",
        padding: "20px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#8892b0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Présentation Interactive</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
            Imputation des Données Manquantes
          </h1>
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 3 }}>Méthodes &amp; Comparaison</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ k: "demo", l: "Démo" }, { k: "compare", l: "Comparaison" }, { k: "python", l: "🐍 Python" }].map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: tab === k ? "#1a1a2e" : "transparent",
              color: tab === k ? "#fff" : "#555",
              border: "1px solid " + (tab === k ? "#1a1a2e" : "#ccd0e0"),
              borderRadius: 6, padding: "7px 18px", cursor: "pointer",
              fontFamily: "DM Mono", fontSize: 12, transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "demo" && (
        <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: "#1a1a2e", marginBottom: 4 }}>Application Interactive</div>
            <div style={{ fontSize: 12, color: "#8892b0" }}>Choisissez une variable et une méthode pour observer l'imputation en temps réel</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #dde1ef", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Variable cible</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["age", "salaire", "experience", "score"].map(c => {
                  const n = BASE_DATA.filter(r => r[c] === null).length;
                  return (
                    <button key={c} onClick={() => setSelectedCol(c)} style={btnStyle(selectedCol === c, null)}>
                      {c} <span style={{ opacity: 0.5, fontSize: 10 }}>({n})</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde1ef", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Statistiques</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatsPill label="N lignes" value={imputedData.length} color="#8892b0" />
                <StatsPill label="Imputées" value={imputedCount} color={method.color} />
                <StatsPill label="Moyenne" value={colData.length ? Math.round(calcMean(colData)) : "—"} color={method.color} />
                <StatsPill label="Écart-type" value={stdDev(colData)} color={method.color} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde1ef", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Méthode d'imputation</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {METHODS.map(m => (
                <button key={m.key} onClick={() => handleMethod(m.key)} style={{
                  background: selectedMethod === m.key ? m.color : "#f0f2f8",
                  color: selectedMethod === m.key ? "#fff" : "#555",
                  border: "1px solid " + (selectedMethod === m.key ? m.color : "#dde1ef"),
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                  fontFamily: "DM Mono", fontSize: 12,
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                }}>
                  <span style={{ fontFamily: "Fraunces, serif", fontWeight: 700 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: method.color + "0d", border: "1px solid " + method.color + "30",
            borderRadius: 10, padding: "14px 18px", marginBottom: 14,
            display: "flex", justifyContent: "space-between", gap: 20,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: method.color, letterSpacing: 1, marginBottom: 6 }}>DESCRIPTION</div>
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>{METHOD_DESCS[selectedMethod]}</div>
            </div>
            <div style={{ display: "flex", gap: 24, minWidth: 200 }}>
              <div>
                <div style={{ fontSize: 10, color: "#27ae60", marginBottom: 6 }}>✓ Avantages</div>
                {METHOD_PROS[selectedMethod].map(p => (
                  <div key={p} style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>· {p}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#e74c3c", marginBottom: 6 }}>✗ Limites</div>
                {METHOD_CONS[selectedMethod].map(p => (
                  <div key={p} style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>· {p}</div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde1ef", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #dde1ef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#555" }}>
                <span style={{ color: method.color }}>■</span> imputées &nbsp;·&nbsp;
                <span style={{ color: "#b0b8cc" }}>■</span> originales &nbsp;·&nbsp;
                <span style={{ color: "#dde1ef" }}>■</span> manquantes
              </div>
              <div style={{ fontSize: 11, color: "#8892b0" }}>{imputedData.length} lignes</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "DM Mono", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #dde1ef", background: "#fafbff" }}>
                    {["ID", "age", "salaire", "experience", "score"].map(h => (
                      <th key={h} style={{
                        padding: "9px 16px", textAlign: "left",
                        color: h.toLowerCase() === selectedCol ? method.color : "#8892b0",
                        fontWeight: h.toLowerCase() === selectedCol ? 600 : 400,
                        fontSize: 11, letterSpacing: 1,
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ opacity: animating ? 0 : 1, transition: "opacity 0.18s" }}>
                  {imputedData.map((row, i) => {
                    const origRow = BASE_DATA.find(r => r.id === row.id);
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fafbff" : "#fff" }}>
                        {["id", "age", "salaire", "experience", "score"].map(c => {
                          const isTarget = c === selectedCol;
                          const wasNull = origRow && origRow[c] === null;
                          const isImputed = isTarget && wasNull && row[c] !== null;
                          const isMissing = row[c] === null;
                          return (
                            <td key={c} style={{
                              padding: "8px 16px",
                              color: isMissing ? "#ccd0e0" : isImputed ? method.color : "#444",
                              background: isImputed ? (method.color + "0c") : "transparent",
                              fontWeight: isImputed ? 600 : 400,
                              borderLeft: isTarget ? ("2px solid " + method.color + "40") : "none",
                            }}>
                              {isMissing ? "—" : row[c]}
                              {isImputed && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>↑</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid #f0f2f8" }}>
              <div style={{ fontSize: 10, color: "#8892b0", marginBottom: 2 }}>Distribution — {selectedCol}</div>
              <MiniBar data={imputedData} col={selectedCol} color={method.color} />
            </div>
          </div>
        </div>
      )}

      {tab === "compare" && (
        <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: "#1a1a2e", marginBottom: 6 }}>Comparaison des Méthodes</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: "#8892b0" }}>Variable :</span>
            {["age", "salaire", "experience", "score"].map(c => {
              const n = BASE_DATA.filter(r => r[c] === null).length;
              return (
                <button key={c} onClick={() => setSelectedCol(c)} style={btnStyle(selectedCol === c, null)}>
                  {c} <span style={{ opacity: 0.5, fontSize: 10 }}>({n})</span>
                </button>
              );
            })}
            <span style={{ fontSize: 11, color: "#b0b8cc", marginLeft: 6 }}>· barre colorée = valeur imputée</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            {METHODS.filter(m => m.key !== "none").map(m => {
              const d = applyMethod(m.key, selectedCol);
              const vals = d.map(r => r[selectedCol]).filter(v => v !== null);
              const imp = BASE_DATA.filter(r => r[selectedCol] === null).length;
              const sd = vals.length > 1 ? Math.round(Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - calcMean(vals), 2), 0) / (vals.length - 1))) : "—";
              return (
                <div key={m.key} style={{
                  background: "#fff", border: "1px solid #dde1ef",
                  borderTop: "3px solid " + m.color,
                  borderRadius: 10, padding: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: m.color, fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700 }}>{m.icon}</span>
                      <span style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 500 }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: m.key === "listwise" ? "#e74c3c" : "#8892b0" }}>
                      {m.key === "listwise" ? ("−" + imp + " lignes") : ("+" + imp + " imputées")}
                    </div>
                  </div>
                  <MiniBar data={d} col={selectedCol} color={m.color} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <StatsPill label="Moy." value={vals.length ? Math.round(calcMean(vals)) : "—"} color={m.color} />
                    <StatsPill label="σ" value={sd} color={m.color} />
                    <StatsPill label="N" value={vals.length} color={m.color} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde1ef", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #dde1ef" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: "#1a1a2e" }}>Tableau Comparatif Général</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "DM Mono", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#fafbff", borderBottom: "1px solid #dde1ef" }}>
                    {["Méthode", "Complexité", "Taux manq. max", "MCAR", "MAR", "MNAR", "Recommandé"].map(h => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: "#8892b0", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { m: "Moyenne/Médiane", comp: "⬛☐☐", max: "< 5%", mcar: "✓", mar: "~", mnar: "✗", rec: "Exploration rapide" },
                    { m: "Mode", comp: "⬛☐☐", max: "< 10%", mcar: "✓", mar: "~", mnar: "✗", rec: "Variables catégorielles" },
                    { m: "Suppression", comp: "⬛☐☐", max: "< 5%", mcar: "✓", mar: "✗", mnar: "✗", rec: "MCAR uniquement" },
                    { m: "K-NN", comp: "⬛⬛☐", max: "< 30%", mcar: "✓", mar: "✓", mnar: "~", rec: "Usage général" },
                    { m: "Interpolation Lin.", comp: "⬛☐☐", max: "< 20%", mcar: "✓", mar: "~", mnar: "✗", rec: "Séries temporelles" },
                    { m: "MICE", comp: "⬛⬛⬛", max: "< 50%", mcar: "✓", mar: "✓", mnar: "~", rec: "Analyse formelle" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f2f8", background: i % 2 === 0 ? "#fafbff" : "#fff" }}>
                      <td style={{ padding: "8px 14px", color: "#1a1a2e", fontWeight: 500 }}>{r.m}</td>
                      <td style={{ padding: "8px 14px", color: "#8892b0", letterSpacing: 2 }}>{r.comp}</td>
                      <td style={{ padding: "8px 14px", color: "#555" }}>{r.max}</td>
                      {[r.mcar, r.mar, r.mnar].map((v, j) => (
                        <td key={j} style={{ padding: "8px 14px", color: v === "✓" ? "#27ae60" : v === "~" ? "#e67e22" : "#e74c3c", fontWeight: 600 }}>{v}</td>
                      ))}
                      <td style={{ padding: "8px 14px", color: "#8892b0", fontSize: 10 }}>{r.rec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "python" && (
        <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: "#1a1a2e", marginBottom: 4 }}>Code Python par Méthode</div>
            <div style={{ fontSize: 12, color: "#8892b0" }}>Formule mathématique + implémentation prête à l'emploi sur n'importe quel dataset</div>
          </div>

          {[
            {
              key: "mean", label: "Moyenne", color: "#3498db", icon: "μ",
              formula: "x̄ = (1/n) Σᵢ xᵢ   →   valeur manquante ← x̄",
              when: "Données numériques continues, taux < 5%, distribution symétrique",
              code: `import pandas as pd

df = pd.read_csv("dataset.csv")

# Imputation par la moyenne
df["salaire"].fillna(df["salaire"].mean(), inplace=True)

# Pour toutes les colonnes numériques en une ligne
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy="mean")
df_imputed = pd.DataFrame(imp.fit_transform(df), columns=df.columns)`
            },
            {
              key: "median", label: "Médiane", color: "#9b59b6", icon: "M",
              formula: "x̃ = valeur centrale après tri   →   valeur manquante ← x̃",
              when: "Données avec outliers, distributions asymétriques (revenus, prix)",
              code: `import pandas as pd

df = pd.read_csv("dataset.csv")

# Imputation par la médiane
df["salaire"].fillna(df["salaire"].median(), inplace=True)

# Avec sklearn
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy="median")
df_imputed = pd.DataFrame(imp.fit_transform(df), columns=df.columns)`
            },
            {
              key: "mode", label: "Mode", color: "#e67e22", icon: "Mo",
              formula: "Mo = valeur la plus fréquente   →   valeur manquante ← Mo",
              when: "Variables catégorielles ou discrètes (genre, catégorie, niveau)",
              code: `import pandas as pd

df = pd.read_csv("dataset.csv")

# Imputation par le mode
df["categorie"].fillna(df["categorie"].mode()[0], inplace=True)

# Avec sklearn (most_frequent)
from sklearn.impute import SimpleImputer
imp = SimpleImputer(strategy="most_frequent")
df_imputed = pd.DataFrame(imp.fit_transform(df), columns=df.columns)`
            },
            {
              key: "knn", label: "K-NN", color: "#27ae60", icon: "K",
              formula: "x̂ = (1/k) Σⱼ xⱼ   où j ∈ k voisins les plus proches (distance euclidienne normalisée)",
              when: "Données tabulaires avec relations entre variables, taux < 30%",
              code: `import pandas as pd
from sklearn.impute import KNNImputer

df = pd.read_csv("dataset.csv")

# K-NN Imputation (k=5 voisins)
imputer = KNNImputer(n_neighbors=5)
df_imputed = pd.DataFrame(
    imputer.fit_transform(df),
    columns=df.columns
)

# Astuce : normaliser avant pour de meilleurs résultats
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
df_scaled = pd.DataFrame(scaler.fit_transform(df), columns=df.columns)
df_imputed_scaled = pd.DataFrame(imputer.fit_transform(df_scaled), columns=df.columns)`
            },
            {
              key: "mice2", label: "MICE — Imputation Multiple", color: "#e74c3c", icon: "∞",
              formula: "Algorithme itératif : P(Xⱼ | X₋ⱼ) — chaque colonne imputée conditionnellement aux autres",
              when: "Données MAR, analyses statistiques formelles, taux jusqu'à 50%",
              code: `import pandas as pd
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import RandomForestRegressor

df = pd.read_csv("dataset.csv")

# MICE avec régression linéaire (défaut)
imputer = IterativeImputer(max_iter=10, random_state=42)
df_imputed = pd.DataFrame(
    imputer.fit_transform(df),
    columns=df.columns
)

# MICE avec Random Forest (plus robuste, non linéaire)
imputer_rf = IterativeImputer(
    estimator=RandomForestRegressor(n_estimators=100, random_state=42),
    max_iter=10,
    random_state=42
)
df_imputed_rf = pd.DataFrame(
    imputer_rf.fit_transform(df),
    columns=df.columns
)

print("Valeurs manquantes restantes :", df_imputed.isna().sum().sum())`
            },
            {
              key: "interpolation", label: "Interpolation Linéaire", color: "#f39c12", icon: "∿",
              formula: "x̂ᵢ = xₚ + (i - p)/(n - p) × (xₙ - xₚ)   où p=précédent, n=suivant",
              when: "Séries temporelles ou données ordonnées (temps, position, dose)",
              code: `import pandas as pd

df = pd.read_csv("dataset.csv", parse_dates=["date"])
df = df.sort_values("date").set_index("date")

# Interpolation linéaire (parfait pour séries temporelles)
df["temperature"] = df["temperature"].interpolate(method="linear")

# Autres méthodes disponibles :
df["valeur"] = df["valeur"].interpolate(method="time")      # pondéré par le temps
df["valeur"] = df["valeur"].interpolate(method="spline", order=2)  # courbe lisse
df["valeur"] = df["valeur"].interpolate(method="nearest")   # voisin le plus proche`
            },
            {
              key: "mice", label: "MICE (Multiple Imputation)", color: "#e74c3c", icon: "∞",
              formula: "Algorithme itératif : impute chaque variable via régression sur les autres, répété jusqu'à convergence",
              when: "Données MAR, analyses statistiques formelles, taux jusqu'à 50%",
              code: `import pandas as pd
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import RandomForestRegressor

df = pd.read_csv("dataset.csv")

# MICE avec régression linéaire (défaut)
imputer = IterativeImputer(max_iter=10, random_state=42)
df_imputed = pd.DataFrame(
    imputer.fit_transform(df),
    columns=df.columns
)

# MICE avec Random Forest (plus robuste)
imputer_rf = IterativeImputer(
    estimator=RandomForestRegressor(n_estimators=100),
    max_iter=10, random_state=42
)
df_imputed_rf = pd.DataFrame(
    imputer_rf.fit_transform(df),
    columns=df.columns
)`
            },
            {
              key: "listwise", label: "Suppression (Listwise)", color: "#95a5a6", icon: "✕",
              formula: "Supprimer toute ligne i si ∃ j tel que xᵢⱼ = NaN",
              when: "MCAR uniquement, taux < 5%, dataset suffisamment grand",
              code: `import pandas as pd

df = pd.read_csv("dataset.csv")

# Suppression complète des lignes avec NaN
df_clean = df.dropna()

# Supprimer seulement si NaN dans certaines colonnes
df_clean = df.dropna(subset=["salaire", "age"])

# Afficher le bilan
missing_before = df.isna().sum().sum()
rows_lost = len(df) - len(df_clean)
print(f"Lignes supprimées : {rows_lost} / {len(df)}")
print(f"Taux de perte : {rows_lost/len(df)*100:.1f}%")`
            },
          ].map((m) => (
            <div key={m.key} style={{
              background: "#fff", border: "1px solid #dde1ef",
              borderLeft: "4px solid " + m.color,
              borderRadius: 10, marginBottom: 20, overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid #f0f2f8",
                display: "flex", alignItems: "center", gap: 12,
                background: m.color + "08",
              }}>
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: m.color, fontWeight: 700, minWidth: 28 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "#8892b0", marginTop: 2 }}>Quand l'utiliser : {m.when}</div>
                </div>
              </div>
              {/* Formula */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f2f8", background: "#fafbff" }}>
                <div style={{ fontSize: 10, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Formule</div>
                <div style={{
                  fontFamily: "Fraunces, serif", fontSize: 15, color: m.color,
                  background: m.color + "0c", padding: "8px 14px", borderRadius: 6,
                  letterSpacing: 0.5,
                }}>{m.formula}</div>
              </div>
              {/* Code */}
              <div style={{ padding: "12px 20px" }}>
                <div style={{ fontSize: 10, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Code Python</div>
                <pre style={{
                  background: "#1a1a2e", color: "#e8f0fe",
                  borderRadius: 8, padding: "16px 18px",
                  fontSize: 12, lineHeight: 1.7, margin: 0,
                  overflowX: "auto", fontFamily: "DM Mono, monospace",
                  whiteSpace: "pre",
                }}>{m.code}</pre>
              </div>
            </div>
          ))}

          {/* Install box */}
          <div style={{
            background: "#1a1a2e", borderRadius: 10, padding: "16px 20px", marginTop: 8,
          }}>
            <div style={{ fontSize: 11, color: "#8892b0", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Installation des librairies</div>
            <pre style={{ color: "#7ec8e3", fontFamily: "DM Mono", fontSize: 13, margin: 0, lineHeight: 1.8 }}>
              {`pip install pandas numpy scikit-learn
pip install fancyimpute        # pour des méthodes avancées (SOFTIMPUTE, MICE)
pip install missingno          # pour visualiser les données manquantes
pip install matplotlib seaborn # pour les graphiques`}
            </pre>
          </div>
        </div>
      )}


      <div style={{ padding: "16px 32px", borderTop: "1px solid #dde1ef", marginTop: 20, textAlign: "center" }}>
        <span style={{ fontSize: 10, color: "#b0b8cc" }}>Imputation des Données Manquantes · Application Pédagogique Interactive</span>
      </div>
    </div>
  );
}
