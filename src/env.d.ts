/// <reference path="../.astro/types.d.ts" />

// Declaración explícita de las variables de entorno públicas usadas en el cliente/servidor.
// Sin esto, import.meta.env.* se infiere como `any` (gap detectado previamente en el proyecto).
interface ImportMetaEnv {
	readonly PUBLIC_FORM_URL: string;
	readonly PUBLIC_WHATSAPP_CONVERSION_LABEL: string;
	/** Site key pública de Cloudflare Turnstile — expuesta al cliente (widget del modal de WhatsApp). */
	readonly PUBLIC_TURNSTILE_SITE_KEY: string;
	/** Secreto de Cloudflare Turnstile — SOLO server-side, usado en src/pages/api/whatsapp-lead.ts. */
	readonly TURNSTILE_SECRET_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
