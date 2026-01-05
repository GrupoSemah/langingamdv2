import axios from 'axios';
export { renderers } from '../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "https://almacenajes-minidepositos.com", "SSR": true};
const prerender = false;
function getSucursalEnumId(sucursal) {
  const sucursalMap = {
    "VH": 670624,
    "RA": 670626,
    "AL": 670628,
    "SA": 670630,
    "M8": 670632,
    "CO": 670634,
    "GO": 670636,
    "DA": 670638,
    "CE": 670640,
    "HM": 670642,
    "TM": 670644
  };
  return sucursalMap[sucursal] || 670624;
}
async function POST({ request }) {
  const headers = { "Content-Type": "application/json" };
  try {
    console.log("=== INICIO API CONTACT AMD ===");
    if (!request) {
      throw new Error("Request object is undefined");
    }
    console.log("Environment:", {
      isVercel: !!Object.assign(__vite_import_meta_env__, { KOMMO_SUBDOMAIN: "itamosemahcom", KOMMO_ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg", KOMMO_PIPELINE_ID: "11583619", KOMMO_STATUS_ID: "88960711", KOMMO_USER_ID: "13527363", KOMMO_EMAIL_FIELD_ID: "290154", KOMMO_PHONE_FIELD_ID: "290152", KOMMO_SUCURSAL_FIELD_ID: "799870", KOMMO_FUENTE_LEAD_ID: "799856", KOMMO_FUENTE_LEAD_ENUM_ID: "670568", NODE: process.env.NODE, NODE_ENV: process.env.NODE_ENV, OS: process.env.OS, _: process.env._ }).VERCEL,
      nodeEnv: process.env.NODE_ENV,
      platform: typeof process !== "undefined" ? process.platform : "unknown"
    });
    const requiredEnvVars = [
      "KOMMO_SUBDOMAIN",
      "KOMMO_ACCESS_TOKEN",
      "KOMMO_PIPELINE_ID",
      "KOMMO_STATUS_ID",
      "KOMMO_USER_ID",
      "KOMMO_EMAIL_FIELD_ID",
      "KOMMO_PHONE_FIELD_ID",
      "KOMMO_SUCURSAL_FIELD_ID",
      "KOMMO_FUENTE_LEAD_ID",
      "KOMMO_FUENTE_LEAD_ENUM_ID"
    ];
    console.log("Verificando variables de entorno...");
    const envStatus = {};
    requiredEnvVars.forEach((varName) => {
      envStatus[varName] = {
        exists: !!Object.assign(__vite_import_meta_env__, { KOMMO_SUBDOMAIN: "itamosemahcom", KOMMO_ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg", KOMMO_PIPELINE_ID: "11583619", KOMMO_STATUS_ID: "88960711", KOMMO_USER_ID: "13527363", KOMMO_EMAIL_FIELD_ID: "290154", KOMMO_PHONE_FIELD_ID: "290152", KOMMO_SUCURSAL_FIELD_ID: "799870", KOMMO_FUENTE_LEAD_ID: "799856", KOMMO_FUENTE_LEAD_ENUM_ID: "670568", NODE: process.env.NODE, NODE_ENV: process.env.NODE_ENV, OS: process.env.OS, _: process.env._ })[varName],
        length: Object.assign(__vite_import_meta_env__, { KOMMO_SUBDOMAIN: "itamosemahcom", KOMMO_ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg", KOMMO_PIPELINE_ID: "11583619", KOMMO_STATUS_ID: "88960711", KOMMO_USER_ID: "13527363", KOMMO_EMAIL_FIELD_ID: "290154", KOMMO_PHONE_FIELD_ID: "290152", KOMMO_SUCURSAL_FIELD_ID: "799870", KOMMO_FUENTE_LEAD_ID: "799856", KOMMO_FUENTE_LEAD_ENUM_ID: "670568", NODE: process.env.NODE, NODE_ENV: process.env.NODE_ENV, OS: process.env.OS, _: process.env._ })[varName] ? Object.assign(__vite_import_meta_env__, { KOMMO_SUBDOMAIN: "itamosemahcom", KOMMO_ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg", KOMMO_PIPELINE_ID: "11583619", KOMMO_STATUS_ID: "88960711", KOMMO_USER_ID: "13527363", KOMMO_EMAIL_FIELD_ID: "290154", KOMMO_PHONE_FIELD_ID: "290152", KOMMO_SUCURSAL_FIELD_ID: "799870", KOMMO_FUENTE_LEAD_ID: "799856", KOMMO_FUENTE_LEAD_ENUM_ID: "670568", NODE: process.env.NODE, NODE_ENV: process.env.NODE_ENV, OS: process.env.OS, _: process.env._ })[varName].length : 0
      };
    });
    console.log("Estado de variables:", envStatus);
    const missingVars = requiredEnvVars.filter((varName) => !Object.assign(__vite_import_meta_env__, { KOMMO_SUBDOMAIN: "itamosemahcom", KOMMO_ACCESS_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg", KOMMO_PIPELINE_ID: "11583619", KOMMO_STATUS_ID: "88960711", KOMMO_USER_ID: "13527363", KOMMO_EMAIL_FIELD_ID: "290154", KOMMO_PHONE_FIELD_ID: "290152", KOMMO_SUCURSAL_FIELD_ID: "799870", KOMMO_FUENTE_LEAD_ID: "799856", KOMMO_FUENTE_LEAD_ENUM_ID: "670568", NODE: process.env.NODE, NODE_ENV: process.env.NODE_ENV, OS: process.env.OS, _: process.env._ })[varName]);
    if (missingVars.length > 0) {
      console.error("Variables de entorno faltantes:", missingVars);
      return new Response(JSON.stringify({
        success: false,
        error: "Configuración del servidor incompleta",
        missingVars,
        envStatus
      }), {
        status: 500,
        headers
      });
    }
    console.log("Parseando datos del formulario...");
    const formData = await request.json();
    console.log("Datos recibidos:", {
      nombre: formData.nombre ? "OK" : "MISSING",
      telefono: formData.telefono ? "OK" : "MISSING",
      email: formData.email ? "OK" : "MISSING",
      empresa: formData.empresa ? "OK" : "OPTIONAL",
      sucursal: formData.sucursal ? "OK" : "MISSING"
    });
    const contactData = {
      name: formData.nombre,
      custom_fields_values: [
        {
          field_id: parseInt("290154"),
          values: [{ value: formData.email }]
        },
        {
          field_id: parseInt("290152"),
          values: [{ value: formData.telefono }]
        }
      ]
    };
    const leadData = [{
      name: `Landing Page - ${formData.nombre}${formData.empresa ? ` (${formData.empresa})` : ""}`,
      price: 0,
      status_id: parseInt("88960711"),
      pipeline_id: parseInt("11583619"),
      responsible_user_id: parseInt("13527363"),
      created_by: parseInt("13527363"),
      custom_fields_values: [
        {
          field_id: parseInt("799870"),
          values: [{ enum_id: getSucursalEnumId(formData.sucursal) }]
        },
        {
          field_id: parseInt("799856"),
          values: [{ enum_id: parseInt("670568") }]
        }
      ],
      _embedded: {
        tags: [{
          name: "Formulario Web"
        }],
        contacts: [contactData],
        ...formData.empresa ? {
          companies: [{
            name: formData.empresa
          }]
        } : {}
      }
    }];
    const kommoUrl = `https://${"itamosemahcom"}.kommo.com/api/v4/leads/complex`;
    console.log("Enviando a Kommo:", {
      url: kommoUrl,
      dataSize: JSON.stringify(leadData).length,
      hasAuth: true
    });
    const response = await axios.post(
      kommoUrl,
      leadData,
      {
        headers: {
          "Authorization": `Bearer ${"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImNmMjA2NmU5Njc2NmJjODRlZDFjZDFhOWRlMzMwM2MzODdiOWI1YzU4YThjNDZkZTQyNzRiYzc3MzJmYzk0NGY1OTRhNjJhNTRkMTRmNDdiIn0.eyJhdWQiOiIxMjE1ODRlYi04NjczLTQwYmQtOThhYi03OGRhOGYwODU3MjQiLCJqdGkiOiJjZjIwNjZlOTY3NjZiYzg0ZWQxY2QxYTlkZTMzMDNjMzg3YjliNWM1OGE4YzQ2ZGU0Mjc0YmM3NzMyZmM5NDRmNTk0YTYyYTU0ZDE0ZjQ3YiIsImlhdCI6MTc2NTQ4MTMzMSwibmJmIjoxNzY1NDgxMzMxLCJleHAiOjE4OTMzNjk2MDAsInN1YiI6IjEzNTI3MzYzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0ODg3MzY3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMjM2MTI1YTctMDY5My00MjhhLWE5YjMtNzYyOTYwMjI2NWUyIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.jm7DVfKze_glpy580UQaCym2QSTspxikTUho_kjnd_qlVFPgFif3lWKoiXTt86r9DmmcKoiYEfwrvY_vMrsSth3TRiQ0uWo2BuG5l54OLZksLKADEFrOpp3U_uW7uuQRR_nmdJQiRjjGV_uYDH1fNAxZkyNRBy7EHPAge7IWsreN20KE0q96G6_JNbaG8FIyuMMMa_xc5F_Xth25mquJHcu9tMmLLTZh8DgskcTQkqYSr8XV1h29sQkcY5hlgrRWzRAkXRo5BRoWEQXa5kCJvuqCodpNC23Lm8xDp-08LJwfGaPCDvKjjrXk0HDvNhdhR4-VibVvsvukTfs2tnMvxg"}`,
          "Content-Type": "application/json"
        },
        timeout: 1e4
      }
    );
    console.log("Respuesta de Kommo:", {
      status: response.status,
      statusText: response.statusText,
      dataKeys: Object.keys(response.data || {})
    });
    let leadId = null;
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      leadId = response.data[0].id;
    } else if (response.data && response.data._embedded && response.data._embedded.leads) {
      leadId = response.data._embedded.leads[0].id;
    }
    return new Response(JSON.stringify({
      success: true,
      leadId,
      message: "Lead creado exitosamente en Kommo"
    }), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("=== ERROR EN API CONTACT AMD ===");
    console.error("Error completo:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    let errorMessage = "Error al enviar el formulario";
    let errorDetails = {
      type: "unknown",
      message: error.message
    };
    if (error.response) {
      console.error("Error de respuesta HTTP:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
      errorDetails = {
        type: "http_response",
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    } else if (error.request) {
      console.error("Error de request:", error.request);
      errorMessage = "Error de conexión con Kommo";
      errorDetails = {
        type: "network",
        message: "No se pudo conectar con Kommo"
      };
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Error de DNS - no se pudo resolver el dominio";
      errorDetails = {
        type: "dns",
        message: error.message
      };
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Timeout - la solicitud tardó demasiado";
      errorDetails = {
        type: "timeout",
        message: error.message
      };
    }
    console.error("Enviando respuesta de error:", { errorMessage, errorDetails });
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: errorDetails,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 500,
      headers
    });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
