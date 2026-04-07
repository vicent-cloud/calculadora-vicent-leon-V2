import React, { useMemo, useState } from "react";

const PROJECT_TYPES = [
  { value: "cocina", label: "Cocina", base: 540, min: 540, obraBaseM2: 720, emoji: "🍽️" },
  { value: "bano", label: "Baño", base: 420, min: 420, obraBaseM2: 810, emoji: "🛁" },
  { value: "salon", label: "Salón / comedor", base: 480, min: 390, obraBaseM2: 510, emoji: "🛋️" },
  { value: "dormitorio", label: "Dormitorio", base: 390, min: 390, obraBaseM2: 420, emoji: "🛏️" },
  { value: "vivienda_parcial", label: "Vivienda parcial", base: 840, min: 900, obraBaseM2: 570, emoji: "🏠" },
  { value: "vivienda_integral", label: "Vivienda completa", base: 1320, min: 1500, obraBaseM2: 660, emoji: "🏡" },
  { value: "home_staging", label: "Home staging", base: 390, min: 390, obraBaseM2: 150, emoji: "✨" },
  { value: "local_comercial", label: "Local comercial", base: 1500, min: 1800, obraBaseM2: 540, emoji: "🏬" },
];

const SERVICE_LEVELS = [
  { value: "solo_idea", label: "Solo idea y distribución", amount: 240 },
  { value: "proyecto_diseno", label: "Proyecto de diseño", amount: 570 },
  { value: "proyecto_compras", label: "Proyecto con compras", amount: 960 },
  { value: "seguimiento_obra", label: "Proyecto con seguimiento de obra", amount: 1440 },
  { value: "integral", label: "Servicio integral completo", amount: 2040 },
];

const AREA_FACTORS = [
  { min: 0, max: 25, factor: 0.85 },
  { min: 26, max: 50, factor: 1.0 },
  { min: 51, max: 80, factor: 1.2 },
  { min: 81, max: 120, factor: 1.45 },
  { min: 121, max: 180, factor: 1.75 },
  { min: 181, max: 250, factor: 2.1 },
  { min: 251, max: Infinity, factor: 2.6 },
];

const URGENCY_FACTORS = {
  mas_6_meses: 1.0,
  entre_3_6_meses: 1.03,
  entre_1_2_meses: 1.08,
  urgente: 1.15,
};

const EXTRAS = {
  moodboard: 150,
  layout: 210,
  renders_1: 180,
  renders_varias: 450,
  renders_vivienda: 840,
  planos_basicos: 210,
  planos_completos: 570,
  shopping_basica: 150,
  shopping_completa: 390,
  procurement: 540,
  visitas_puntuales: 270,
  visitas_mensuales: 540,
  visitas_semanales: 1080,
};

const COMPLEXITY_ADDITIONS = {
  structural: { no: 0, leves: 0.1, importantes: 0.22 },
  wet: { no: 0, una: 0.08, dos_mas: 0.16 },
  custom: { no: 0, alguna: 0.07, varias: 0.14, muy_personalizado: 0.22 },
};

const PROPERTY_STATUS_WORK_FACTOR = {
  obra_nueva: 0.9,
  reforma_parcial: 0.85,
  reforma_integral: 1,
  alquiler: 0.8,
  venta: 0.75,
};

const WORK_MANAGEMENT_FACTOR = {
  con_interiorista: 1,
  solo_obra_particular: 1.15,
};

const LOCATION_FACTORS = {
  barcelona_alrededores: { interior: 1, obra: 1 },
  baleares: { interior: 1.15, obra: 1.15 },
  resto_espana: { interior: 1.15, obra: 1 },
};

const initialForm = {
  projectType: "",
  areaM2: "",
  propertyStatus: "reforma_integral",
  location: "barcelona_alrededores",
  workManagement: "con_interiorista",
  serviceLevel: "",
  layout: true,
  moodboard: true,
  renders: "no",
  drawings: "no",
  shoppingList: "no",
  procurement: false,
  siteVisits: "no",
  structuralChanges: "no",
  wetAreas: "no",
  customFurniture: "no",
  timeline: "entre_3_6_meses",
  fullName: "",
  email: "",
  phone: "",
  consent: false,
};

const steps = ["Proyecto", "Alcance", "Complejidad", "Contacto", "Resultado"];

const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbydnvW705iPiAs-I1K9jCaeSUaWnAfiUJR_dg5-a_w0sPLozTWGiP4FHZb6-LXX_jg5Gw/exec";
const WHATSAPP_NUMBER = "34622295710"; // 👉 Sustituye por tu número (formato internacional sin +)
const LOGO_URL = "";
const BRAND = {
  navy: "#002654",
  beige: "#FCF3DE",
  beigeSoft: "#F7F0DF",
  border: "#E8DDC2",
  text: "#0f172a",
};

function euro(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getAreaFactor(m2) {
  const row = AREA_FACTORS.find((r) => m2 >= r.min && m2 <= r.max);
  return row ? row.factor : 1;
}

function rangeFromBase(base) {
  const center = Math.round(base / 50) * 50;
  const min = Math.round((center * 0.95) / 50) * 50;
  const max = Math.round((center * 1.05) / 50) * 50;
  return { min, max };
}

function fieldStyle() {
  return {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fffdf8",
  };
}

function cardStyle(featured = false) {
  return {
    background: BRAND.beige,
    border: featured ? `2px solid ${BRAND.navy}` : `1px solid ${BRAND.border}`,
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  };
}

function labelStyle() {
  return { display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#334155" };
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={labelStyle()}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle()}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const selectedProject = PROJECT_TYPES.find((item) => item.value === form.projectType);

  const calculation = useMemo(() => {
    if (!selectedProject || !form.serviceLevel || !form.areaM2) return null;

    const area = Number(form.areaM2);
    const base = selectedProject.base;
    const service = (SERVICE_LEVELS.find((s) => s.value === form.serviceLevel) || { amount: 0 }).amount;

    let extras = 0;
    if (form.layout) extras += EXTRAS.layout;
    if (form.moodboard) extras += EXTRAS.moodboard;
    if (form.renders === "una") extras += EXTRAS.renders_1;
    if (form.renders === "varias") extras += EXTRAS.renders_varias;
    if (form.renders === "vivienda") extras += EXTRAS.renders_vivienda;
    if (form.drawings === "basicos") extras += EXTRAS.planos_basicos;
    if (form.drawings === "completos") extras += EXTRAS.planos_completos;
    if (form.shoppingList === "basica") extras += EXTRAS.shopping_basica;
    if (form.shoppingList === "completa") extras += EXTRAS.shopping_completa;
    if (form.procurement) extras += EXTRAS.procurement;
    if (form.siteVisits === "puntuales") extras += EXTRAS.visitas_puntuales;
    if (form.siteVisits === "mensuales") extras += EXTRAS.visitas_mensuales;
    if (form.siteVisits === "semanales") extras += EXTRAS.visitas_semanales;

    const subtotal = base + service + extras;
    const areaFactor = getAreaFactor(area);
    const complexityRaw =
      1 +
      (COMPLEXITY_ADDITIONS.structural[form.structuralChanges] || 0) +
      (COMPLEXITY_ADDITIONS.wet[form.wetAreas] || 0) +
      (COMPLEXITY_ADDITIONS.custom[form.customFurniture] || 0);
    const complexity = Math.min(complexityRaw, 1.3);
    const urgency = URGENCY_FACTORS[form.timeline] || 1;
    const locationFactors = LOCATION_FACTORS[form.location] || LOCATION_FACTORS.barcelona_alrededores;

    const interiorBaseTotal = Math.max(Math.round(subtotal * areaFactor * complexity * urgency), selectedProject.min);
    const interiorTotal = Math.round(interiorBaseTotal * locationFactors.interior);

    const workBase = Math.round(area * selectedProject.obraBaseM2 * (PROPERTY_STATUS_WORK_FACTOR[form.propertyStatus] || 1) * complexity);
    const workTotalBeforeManagement = Math.round(workBase * locationFactors.obra);
    const workTotal = Math.round(workTotalBeforeManagement * (WORK_MANAGEMENT_FACTOR[form.workManagement] || 1));

    const workRange = rangeFromBase(workTotal);
    const feesRange = rangeFromBase(interiorTotal);
    const globalRange = {
      min: workRange.min + feesRange.min,
      max: workRange.max + feesRange.max,
    };

    return {
      workRange,
      feesRange,
      globalRange,
      workSurcharge: form.workManagement === "solo_obra_particular",
    };
  }, [form, selectedProject]);

  const canContinue = () => {
    if (step === 0) return Boolean(form.projectType && form.areaM2);
    if (step === 1) return Boolean(form.serviceLevel);
    if (step === 3) return Boolean(form.fullName && form.email && form.phone && form.consent);
    return true;
  };

  const progress = `${((step + 1) / steps.length) * 100}%`;

  const submitLead = async () => {
    setSubmitError("");

    if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT") {
      setSubmitError("Falta conectar la URL de Google Sheets en el código.");
      return false;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        createdAt: new Date().toISOString(),
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        projectType: form.projectType,
        areaM2: form.areaM2,
        propertyStatus: form.propertyStatus,
        location: form.location,
        workManagement: form.workManagement,
        serviceLevel: form.serviceLevel,
        layout: form.layout,
        moodboard: form.moodboard,
        renders: form.renders,
        drawings: form.drawings,
        shoppingList: form.shoppingList,
        procurement: form.procurement,
        siteVisits: form.siteVisits,
        structuralChanges: form.structuralChanges,
        wetAreas: form.wetAreas,
        customFurniture: form.customFurniture,
        timeline: form.timeline,
        consent: form.consent,
        estimationWorkMin: calculation?.workRange?.min || "",
        estimationWorkMax: calculation?.workRange?.max || "",
        estimationFeesMin: calculation?.feesRange?.min || "",
        estimationFeesMax: calculation?.feesRange?.max || "",
        estimationTotalMin: calculation?.globalRange?.min || "",
        estimationTotalMax: calculation?.globalRange?.max || "",
      };

      const response = await fetch(SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudieron guardar los datos.");
      }

      return true;
    } catch (error) {
      setSubmitError("No se ha podido guardar el lead. Revisa la conexión con Google Sheets.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 3) {
      const success = await submitLead();
      if (!success) return;

      // 👉 Ir al resultado primero
      setStep(4);
      return;
    }

    // 👉 Desde resultado → abrir WhatsApp
    if (step === 4) {
      const message = `Hola, soy ${form.fullName}. Acabo de completar la calculadora de VICENT LEON Interiorismo y me gustaría comentar mi proyecto.`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      window.location.href = url;
      return;
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.beigeSoft, fontFamily: "Arial, sans-serif", color: BRAND.text }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <div style={{ background: BRAND.beige, borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.08)", border: `1px solid ${BRAND.border}` }}>
          <div style={{ background: BRAND.navy, color: "#fff", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="VICENT LEON Interiorismo" style={{ height: 42, width: "auto", display: "block" }} />
              ) : (
                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.14)", padding: "6px 12px", borderRadius: 999, fontSize: 12 }}>
                  VICENT LEON Interiorismo
                </div>
              )}
            </div>
            <h1 style={{ margin: "16px 0 8px", fontSize: 30 }}>Calculadora de inversión y honorarios</h1>
            <p style={{ margin: 0, opacity: 0.85 }}>Calcula de forma orientativa la inversión de obra y los honorarios de interiorismo.</p>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", fontSize: 14, opacity: 0.85 }}>
              <span>Paso {step + 1} de {steps.length}</span>
              <span>{steps[step]}</span>
            </div>
            <div style={{ marginTop: 10, height: 8, background: "rgba(255,255,255,0.16)", borderRadius: 999 }}>
              <div style={{ width: progress, height: 8, background: "#fff", borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {step === 0 && (
              <div>
                <h2 style={{ marginTop: 0 }}>Cuéntanos qué tipo de proyecto tienes</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 20 }}>
                  {PROJECT_TYPES.map((item) => {
                    const active = form.projectType === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => update("projectType", item.value)}
                        style={{
                          padding: 16,
                          borderRadius: 16,
                          border: active ? `2px solid ${BRAND.navy}` : `1px solid ${BRAND.border}`,
                          background: active ? BRAND.navy : "#fffaf0",
                          color: active ? "#fff" : "#0f172a",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <><span style={{ fontSize: 18, marginRight: 8 }}>{item.emoji}</span>{item.label}</>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyle()}>Superficie aproximada (m²)</label>
                    <input type="number" value={form.areaM2} onChange={(e) => update("areaM2", e.target.value)} placeholder="Ej. 95" style={fieldStyle()} />
                  </div>
                  <SelectField
                    label="Situación del inmueble"
                    value={form.propertyStatus}
                    onChange={(value) => update("propertyStatus", value)}
                    options={[
                      { value: "obra_nueva", label: "Obra nueva" },
                      { value: "reforma_parcial", label: "Reforma parcial" },
                      { value: "reforma_integral", label: "Reforma integral" },
                      { value: "alquiler", label: "Vivienda para alquilar" },
                      { value: "venta", label: "Vivienda para vender" },
                    ]}
                  />
                </div>

                <div style={{ height: 16 }} />
                <SelectField
                  label="Dónde está el proyecto"
                  value={form.location}
                  onChange={(value) => update("location", value)}
                  options={[
                    { value: "barcelona_alrededores", label: "Barcelona y alrededores" },
                    { value: "baleares", label: "Baleares" },
                    { value: "resto_espana", label: "Resto de España" },
                  ]}
                />

                <div style={{ height: 16 }} />
                <SelectField
                  label="Cómo quieres gestionar la obra"
                  value={form.workManagement}
                  onChange={(value) => update("workManagement", value)}
                  options={[
                    { value: "con_interiorista", label: "Quiero obra coordinada con interiorismo" },
                    { value: "solo_obra_particular", label: "Quiero contratar la obra directamente como particular" },
                  ]}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 style={{ marginTop: 0 }}>Define el alcance del servicio</h2>
                <SelectField
                  label="Nivel de servicio"
                  value={form.serviceLevel}
                  onChange={(value) => update("serviceLevel", value)}
                  placeholder="Selecciona el nivel de servicio"
                  options={SERVICE_LEVELS.map((item) => ({ value: item.value, label: item.label }))}
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginTop: 16 }}>
                  <label style={{ ...cardStyle(false), display: "flex", alignItems: "center", gap: 10, padding: 16 }}>
                    <input type="checkbox" checked={form.layout} onChange={(e) => update("layout", e.target.checked)} />
                    <span>Propuesta de distribución</span>
                  </label>
                  <label style={{ ...cardStyle(false), display: "flex", alignItems: "center", gap: 10, padding: 16 }}>
                    <input type="checkbox" checked={form.moodboard} onChange={(e) => update("moodboard", e.target.checked)} />
                    <span>Moodboard y dirección estética</span>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 16 }}>
                  <SelectField label="Renders o imágenes 3D" value={form.renders} onChange={(value) => update("renders", value)} options={[{ value: "no", label: "No" }, { value: "una", label: "1 estancia" }, { value: "varias", label: "Varias estancias" }, { value: "vivienda", label: "Vivienda completa" }]} />
                  <SelectField label="Planos técnicos" value={form.drawings} onChange={(value) => update("drawings", value)} options={[{ value: "no", label: "No" }, { value: "basicos", label: "Básicos" }, { value: "completos", label: "Completos para industriales" }]} />
                  <SelectField label="Shopping list" value={form.shoppingList} onChange={(value) => update("shoppingList", value)} options={[{ value: "no", label: "No" }, { value: "basica", label: "Básica" }, { value: "completa", label: "Completa" }]} />
                  <SelectField label="Visitas y coordinación" value={form.siteVisits} onChange={(value) => update("siteVisits", value)} options={[{ value: "no", label: "No" }, { value: "puntuales", label: "Puntuales" }, { value: "mensuales", label: "Mensuales" }, { value: "semanales", label: "Semanales" }]} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ marginTop: 0 }}>Complejidad del proyecto</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                  <SelectField label="Cambios de distribución o demolición" value={form.structuralChanges} onChange={(value) => update("structuralChanges", value)} options={[{ value: "no", label: "No" }, { value: "leves", label: "Leves" }, { value: "importantes", label: "Importantes" }]} />
                  <SelectField label="Intervención en zonas húmedas" value={form.wetAreas} onChange={(value) => update("wetAreas", value)} options={[{ value: "no", label: "No" }, { value: "una", label: "1 zona húmeda" }, { value: "dos_mas", label: "2 o más zonas húmedas" }]} />
                  <SelectField label="Mobiliario a medida" value={form.customFurniture} onChange={(value) => update("customFurniture", value)} options={[{ value: "no", label: "No" }, { value: "alguna", label: "Alguna pieza" }, { value: "varias", label: "Varias piezas" }, { value: "muy_personalizado", label: "Proyecto muy personalizado" }]} />
                  <SelectField label="Cuándo te gustaría empezar" value={form.timeline} onChange={(value) => update("timeline", value)} options={[{ value: "mas_6_meses", label: "Más de 6 meses" }, { value: "entre_3_6_meses", label: "Entre 3 y 6 meses" }, { value: "entre_1_2_meses", label: "Entre 1 y 2 meses" }, { value: "urgente", label: "Urgente" }]} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ marginTop: 0 }}>Recibe tu estimación</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyle()}>Nombre</label>
                    <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Tu nombre" style={fieldStyle()} />
                  </div>
                  <div>
                    <label style={labelStyle()}>Email</label>
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Tu email" style={fieldStyle()} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle()}>Teléfono</label>
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Tu teléfono" style={fieldStyle()} />
                  </div>
                </div>
                <label style={{ ...cardStyle(false), display: "flex", gap: 10, marginTop: 16, padding: 16 }}>
                  <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} />
                  <span style={{ fontSize: 14 }}>Acepto la política de privacidad y autorizo el uso de mis datos para recibir la estimación y el contacto comercial.</span>
                </label>
                {submitError ? (
                  <div style={{ marginTop: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, fontSize: 14 }}>
                    {submitError}
                  </div>
                ) : null}
              </div>
            )}

            {step === 4 && calculation && (
              <div>
                <h2 style={{ marginTop: 0 }}>Tu estimación orientativa</h2>
                <p style={{ color: "#475569" }}>Este resultado no es un presupuesto cerrado. Es una estimación razonada que separa inversión de obra y honorarios de interiorismo.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                  <div style={cardStyle(true)}>
                    <div style={{ fontSize: 14, color: "#64748b" }}>Inversión estimada de obra</div>
                    <div style={{ marginTop: 12, fontSize: 28, fontWeight: 700, color: BRAND.navy }}>
                      {euro(calculation.workRange.min)} - {euro(calculation.workRange.max)}
                    </div>
                  </div>
                  <div style={cardStyle(true)}>
                    <div style={{ fontSize: 14, color: "#64748b" }}>Honorarios estimados</div>
                    <div style={{ marginTop: 12, fontSize: 28, fontWeight: 700, color: "#002654" }}>
                      {euro(calculation.feesRange.min)} - {euro(calculation.feesRange.max)}
                    </div>
                  </div>
                  <div style={{ ...cardStyle(true), gridColumn: "1 / -1", background: BRAND.navy, color: "#fff" }}>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>Total estimado proyecto + obra</div>
                    <div style={{ marginTop: 12, fontSize: 32, fontWeight: 700 }}>
                      {euro(calculation.globalRange.min)} - {euro(calculation.globalRange.max)}
                    </div>
                    {calculation.workSurcharge ? (
                      <p style={{ marginTop: 12, opacity: 0.85 }}>
                        La obra contratada directamente por un particular incrementa la estimación un 15% por mayor dedicación en reuniones y gestiones.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
                disabled={step === 0}
                style={{ padding: "12px 18px", borderRadius: 14, border: "1px solid #cbd5e1", background: "#fffaf0", cursor: "pointer", opacity: step === 0 ? 0.5 : 1 }}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={step === steps.length - 1 || !canContinue()}
                style={{ padding: "12px 18px", borderRadius: 14, border: "none", background: "#002654", color: "#fff", cursor: "pointer", opacity: step === steps.length - 1 || !canContinue() ? 0.5 : 1 }}
              >
                {isSubmitting ? "Guardando..." : step === 3 ? "Ver resultado" : step === 4 ? "Hablar por WhatsApp" : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
