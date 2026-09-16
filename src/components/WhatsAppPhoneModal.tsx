import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { WHATSAPP_MODAL_OPEN_EVENT, type WhatsAppModalOpenDetail } from '../scripts/whatsappModalBridge';

const DEFAULT_COUNTRY: CountryCode = 'PA';

// Países más relevantes para el negocio primero (Panamá al inicio); el resto de la lista de
// libphonenumber-js queda disponible debajo, ordenada alfabéticamente por nombre localizado.
const PRIORITY_COUNTRIES: CountryCode[] = ['PA', 'US', 'CR', 'CO', 'MX', 'VE', 'ES'];

// Timeout corto para el POST best-effort del lead — nunca debe demorar al usuario camino a WhatsApp.
const LEAD_REQUEST_TIMEOUT_MS = 1500;

// Declaración global del widget Turnstile — mismo contrato que LeadQuizForm.tsx (form-almacenajes),
// replicado acá porque no hay forma de compartir tipos entre los dos repos.
declare global {
	interface Window {
		turnstile?: {
			render: (
				container: string | HTMLElement,
				options: {
					sitekey: string;
					callback: (token: string) => void;
					'expired-callback': () => void;
					'error-callback': () => void;
					theme?: 'light' | 'dark' | 'auto';
				}
			) => string;
			reset: (widgetId: string) => void;
			remove: (widgetId: string) => void;
		};
	}
}

interface CountryOption {
	code: CountryCode;
	name: string;
	callingCode: string;
	flag: string;
}

interface WhatsAppPhoneModalProps {
	lang: 'es' | 'en';
	title: string;
	description: string;
	countryLabel: string;
	phoneLabel: string;
	phonePlaceholder: string;
	phoneError: string;
	cta: string;
	ctaSending: string;
	cancel: string;
	closeAria: string;
	/** Site key pública de Cloudflare Turnstile — resuelta server-side en Layout.astro. */
	siteKey: string;
	/** Mensaje mostrado si el usuario intenta continuar sin completar el challenge. */
	turnstileError: string;
}

/** Convierte un código ISO de 2 letras (ej. "PA") en su emoji de bandera correspondiente. */
function countryCodeToFlagEmoji(code: string): string {
	return code
		.toUpperCase()
		.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function buildCountryOptions(lang: 'es' | 'en'): CountryOption[] {
	const displayNames = new Intl.DisplayNames([lang], { type: 'region' });

	const options = getCountries().map((code) => ({
		code,
		name: displayNames.of(code) ?? code,
		callingCode: getCountryCallingCode(code),
		flag: countryCodeToFlagEmoji(code),
	}));

	return options.sort((a, b) => {
		const priorityA = PRIORITY_COUNTRIES.indexOf(a.code);
		const priorityB = PRIORITY_COUNTRIES.indexOf(b.code);

		if (priorityA !== -1 || priorityB !== -1) {
			return (priorityA === -1 ? PRIORITY_COUNTRIES.length : priorityA) -
				(priorityB === -1 ? PRIORITY_COUNTRIES.length : priorityB);
		}

		return a.name.localeCompare(b.name);
	});
}

/**
 * POST best-effort a /api/whatsapp-lead. Cualquier falla (404, timeout, red caída, o rechazo por
 * Turnstile del lado del servidor) se ignora a propósito: jamás debe bloquear ni demorar la
 * navegación del usuario hacia WhatsApp — la verificación de Turnstile solo decide si el lead se
 * registra en Kommo, nunca si el usuario llega a WhatsApp.
 */
async function sendLeadBestEffort(payload: {
	phone: string;
	lang: string;
	source: string;
	turnstileToken: string;
}): Promise<void> {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), LEAD_REQUEST_TIMEOUT_MS);

	try {
		await fetch('/api/whatsapp-lead', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			signal: controller.signal,
		});
	} catch {
		// Silencioso a propósito — ver nota arriba.
	} finally {
		window.clearTimeout(timeoutId);
	}
}

// ─── Widget Turnstile ────────────────────────────────────────────────────────
// Mismo patrón que form-almacenajes/src/components/LeadQuizForm.tsx: espera a que
// window.turnstile esté disponible (el script se carga async/defer en Layout.astro),
// renderiza el widget managed y limpia la instancia al desmontar/remontar.

interface TurnstileWidgetProps {
	siteKey: string;
	onToken: (token: string) => void;
	onExpired: () => void;
}

function TurnstileWidget({ siteKey, onToken, onExpired }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);

	useEffect(() => {
		const renderWidget = () => {
			if (!containerRef.current || !window.turnstile) return;

			if (widgetIdRef.current) {
				try {
					window.turnstile?.remove(widgetIdRef.current);
				} catch {
					// ignorar errores de limpieza
				}
			}

			widgetIdRef.current = window.turnstile.render(containerRef.current, {
				sitekey: siteKey,
				callback: onToken,
				'expired-callback': onExpired,
				'error-callback': onExpired,
				theme: 'light',
			});
		};

		if (window.turnstile) {
			renderWidget();
		} else {
			const intervalId = window.setInterval(() => {
				if (window.turnstile) {
					window.clearInterval(intervalId);
					renderWidget();
				}
			}, 200);

			return () => window.clearInterval(intervalId);
		}

		return () => {
			if (widgetIdRef.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetIdRef.current);
				} catch {
					// ignorar
				}
			}
		};
	}, [siteKey, onToken, onExpired]);

	return <div ref={containerRef} className="mt-4" />;
}

/** Heurística simple de mobile — mismo criterio que el resto del sitio para deep links de WhatsApp. */
function isMobileUserAgent(): boolean {
	if (typeof navigator === 'undefined') return false;
	return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Abre/navega a WhatsApp. Debe invocarse como la PRIMERA acción síncrona del handler de submit
 * (antes del `fetch` best-effort del lead) — el click en "Continuar a WhatsApp" es en sí mismo
 * un gesto de usuario genuino, así que el navegador no bloquea `window.open` acá aunque se llame
 * antes de un `await` posterior en el mismo handler. En mobile se usa `location.href` (deep link
 * directo, sin pop-up); en desktop `window.open` con fallback a `location.href` en la misma
 * pestaña si el navegador igual lo bloquea (poco probable en este flujo, pero por las dudas).
 */
function navigateToWhatsApp(whatsappUrl: string): void {
	if (isMobileUserAgent()) {
		window.location.href = whatsappUrl;
		return;
	}

	const newWindow = window.open(whatsappUrl, '_blank', 'noopener');
	if (!newWindow) {
		window.location.href = whatsappUrl;
	}
}

export default function WhatsAppPhoneModal({
	lang,
	title,
	description,
	countryLabel,
	phoneLabel,
	phonePlaceholder,
	phoneError,
	cta,
	ctaSending,
	cancel,
	closeAria,
	siteKey,
	turnstileError,
}: WhatsAppPhoneModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isAnimatingIn, setIsAnimatingIn] = useState(false);
	const [pending, setPending] = useState<WhatsAppModalOpenDetail | null>(null);
	const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
	const [phoneInput, setPhoneInput] = useState('');
	const [touched, setTouched] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	// Token Turnstile — null hasta que el widget resuelva el challenge. El botón de submit queda
	// deshabilitado mientras sea null, además de la validación de teléfono (isValid).
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const [showTurnstileError, setShowTurnstileError] = useState(false);

	const dialogRef = useRef<HTMLDivElement>(null);
	const phoneInputRef = useRef<HTMLInputElement>(null);
	const lastFocusedElementRef = useRef<HTMLElement | null>(null);
	// Guard SÍNCRONO contra doble-click en "Continuar a WhatsApp": la navegación ahora ocurre
	// como primera línea de handleSubmit, antes de cualquier await, así que un segundo click
	// disparado antes de que React re-renderice con isSubmitting=true (y el botón quede
	// disabled) podría abrir una segunda ventana o mandar un segundo POST. Un ref se actualiza
	// de forma inmediata (sin esperar el ciclo de render), a diferencia del state.
	const isSubmittingRef = useRef(false);

	const titleId = useId();
	const descriptionId = useId();
	const errorId = useId();

	const countryOptions = useMemo(() => buildCountryOptions(lang), [lang]);

	const isValid = useMemo(() => {
		if (!phoneInput.trim()) return false;
		return parsePhoneNumberFromString(phoneInput, country)?.isValid() ?? false;
	}, [phoneInput, country]);

	const showError = touched && phoneInput.trim() !== '' && !isValid;

	const handleTurnstileToken = useCallback((token: string) => {
		setTurnstileToken(token);
		setShowTurnstileError(false);
	}, []);

	const handleTurnstileExpired = useCallback(() => {
		setTurnstileToken(null);
	}, []);

	const closeModal = useCallback(() => {
		setIsOpen(false);
		setPending(null);
		lastFocusedElementRef.current?.focus();
		lastFocusedElementRef.current = null;
	}, []);

	const handleCancel = useCallback(() => {
		// Ya no hay ninguna ventana pre-abierta que cerrar: la navegación a WhatsApp solo ocurre
		// dentro de handleSubmit, después de que el usuario confirma el teléfono — cancelar antes
		// de eso simplemente cierra el modal sin haber abierto nada.
		closeModal();
	}, [closeModal]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				handleCancel();
				return;
			}

			if (event.key !== 'Tab' || !dialogRef.current) return;

			const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
				'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		},
		[handleCancel],
	);

	// Escucha el evento disparado por WhatsAppButton.astro / CotizacionWhatsApp.astro.
	useEffect(() => {
		function handleOpen(event: Event) {
			const detail = (event as CustomEvent<WhatsAppModalOpenDetail>).detail;
			lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
			isSubmittingRef.current = false;
			setPending(detail);
			setCountry(DEFAULT_COUNTRY);
			setPhoneInput('');
			setTouched(false);
			setIsSubmitting(false);
			// Reset del token: el widget se remonta desde cero al reabrir el modal (ver TurnstileWidget
			// más abajo, condicionado a isOpen), así que necesita un challenge nuevo cada vez.
			setTurnstileToken(null);
			setShowTurnstileError(false);
			setIsOpen(true);
		}

		document.addEventListener(WHATSAPP_MODAL_OPEN_EVENT, handleOpen);
		return () => document.removeEventListener(WHATSAPP_MODAL_OPEN_EVENT, handleOpen);
	}, []);

	// Foco inicial, bloqueo de scroll y listeners de teclado mientras el modal está abierto.
	useEffect(() => {
		if (!isOpen) {
			setIsAnimatingIn(false);
			return;
		}

		phoneInputRef.current?.focus();
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', handleKeyDown);

		const raf = requestAnimationFrame(() => setIsAnimatingIn(true));

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', handleKeyDown);
			cancelAnimationFrame(raf);
		};
	}, [isOpen, handleKeyDown]);

	const handleCountryChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		setCountry(event.target.value as CountryCode);
		setPhoneInput('');
		setTouched(false);
		phoneInputRef.current?.focus();
	}, []);

	const handlePhoneChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const formatted = new AsYouType(country).input(event.target.value);
			setPhoneInput(formatted);
			setTouched(true);
		},
		[country],
	);

	const handleSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!isValid || !pending || isSubmittingRef.current) return;

			// Defensivo: el botón ya queda deshabilitado sin token (ver disabled más abajo), pero un
			// submit implícito por Enter en un input podría saltarse ese estado en algunos navegadores.
			if (!turnstileToken) {
				setShowTurnstileError(true);
				return;
			}

			// Guard síncrono PRIMERO (ver comentario en la declaración del ref): bloquea un segundo
			// click/submit antes de que React re-renderice con el botón disabled.
			isSubmittingRef.current = true;
			setIsSubmitting(true);

			// Navegar a WhatsApp es la PRIMERA acción real del handler, antes de cualquier await —
			// este click es un gesto de usuario genuino, así que no dispara el bloqueador de pop-ups.
			// Ya no hace falta pre-abrir una ventana en blanco en el trigger original (float button /
			// CTA de cotización): eso era lo que generaba la pestaña en blanco confusa reportada.
			navigateToWhatsApp(pending.whatsappUrl);

			const e164Phone = parsePhoneNumberFromString(phoneInput, country)?.number ?? phoneInput;

			await sendLeadBestEffort({
				phone: e164Phone,
				lang,
				source: pending.source,
				turnstileToken,
			});

			closeModal();
		},
		[isValid, pending, turnstileToken, phoneInput, country, lang, closeModal],
	);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
			role="presentation"
		>
			<div
				className={`absolute inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity duration-200 ${
					isAnimatingIn ? 'opacity-100' : 'opacity-0'
				}`}
				onClick={handleCancel}
				aria-hidden="true"
			/>

			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				className={`relative z-10 w-full max-w-md rounded-t-2xl bg-white shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl ${
					isAnimatingIn ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-4 opacity-0 sm:scale-95'
				}`}
			>
				<div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 pt-5 pb-4 sm:px-6">
					<div>
						<h2 id={titleId} className="text-lg font-extrabold text-[var(--color-dark)]">
							{title}
						</h2>
						<p id={descriptionId} className="mt-1 text-sm text-gray-600">
							{description}
						</p>
					</div>
					<button
						type="button"
						onClick={handleCancel}
						disabled={isSubmitting}
						aria-label={closeAria}
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:enabled:bg-red-50 hover:enabled:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6">
					<label htmlFor={`${titleId}-country`} className="mb-1 block text-sm font-medium text-gray-700">
						{countryLabel}
					</label>
					<select
						id={`${titleId}-country`}
						value={country}
						onChange={handleCountryChange}
						className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
					>
						{countryOptions.map((option) => (
							<option key={option.code} value={option.code}>
								{option.flag} {option.name} (+{option.callingCode})
							</option>
						))}
					</select>

					<label htmlFor={`${titleId}-phone`} className="mb-1 block text-sm font-medium text-gray-700">
						{phoneLabel}
					</label>
					<input
						ref={phoneInputRef}
						id={`${titleId}-phone`}
						type="tel"
						inputMode="tel"
						autoComplete="tel-national"
						placeholder={phonePlaceholder}
						value={phoneInput}
						onChange={handlePhoneChange}
						aria-invalid={showError}
						aria-describedby={showError ? errorId : undefined}
						className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none ${
							showError
								? 'border-red-400 focus:border-red-500 focus:ring-red-200'
								: 'border-gray-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]'
						}`}
					/>
					{showError && (
						<p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
							{phoneError}
						</p>
					)}

					{/* Widget Turnstile — el botón "Continuar a WhatsApp" queda deshabilitado hasta que
					    resuelva el challenge, además de la validación de teléfono (isValid). */}
					<TurnstileWidget
						siteKey={siteKey}
						onToken={handleTurnstileToken}
						onExpired={handleTurnstileExpired}
					/>
					{showTurnstileError && !turnstileToken && (
						<p role="alert" className="mt-1.5 text-sm text-red-600">
							{turnstileError}
						</p>
					)}

					<button
						type="submit"
						disabled={!isValid || !turnstileToken || isSubmitting}
						className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3.5 font-extrabold text-white shadow-lg transition-all duration-300 hover:enabled:scale-[1.02] hover:enabled:bg-[#20BD5A] hover:enabled:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? ctaSending : cta}
					</button>

					<button
						type="button"
						onClick={handleCancel}
						disabled={isSubmitting}
						className="mt-2.5 w-full rounded-lg px-6 py-2 text-sm font-medium text-gray-500 transition-colors hover:enabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{cancel}
					</button>
				</form>
			</div>
		</div>
	);
}
