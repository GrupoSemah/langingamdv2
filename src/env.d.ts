/// <reference path="../.astro/types.d.ts" />

// Declaración explícita de las variables de entorno públicas usadas en el cliente/servidor.
// Sin esto, import.meta.env.* se infiere como `any` (gap detectado previamente en el proyecto).
interface ImportMetaEnv {
	readonly PUBLIC_FORM_URL: string;
	readonly PUBLIC_WHATSAPP_CONVERSION_LABEL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
