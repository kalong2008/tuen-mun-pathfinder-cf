import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { Shell } from "../components/shell";
import { deliverEnquiry } from "../server/contact-mail";

const TURNSTILE_SITEKEY = "0x4AAAAAAFwu5Ht-if_CdPBa";
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const sendEnquiry = createServerFn({ method: "POST" })
  .validator((input: EnquiryForm) => input)
  .handler(async ({ data }) => deliverEnquiry(data, clientAddress(getRequest())));

type EnquiryFields = {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string;
};

type EnquiryForm = EnquiryFields & {
  "cf-turnstile-response": string;
};

type TurnstileWidgetId = string;
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
    },
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove: (widgetId: TurnstileWidgetId) => void;
};

type FieldName = "name" | "email" | "phone" | "message";
type FieldErrors = Record<FieldName, string>;
type Status = "idle" | "loading" | "success" | "error";

const EMPTY_FORM: EnquiryFields = { name: "", email: "", phone: "", message: "", website: "" };
const EMPTY_ERRORS: FieldErrors = { name: "", email: "", phone: "", message: "" };

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "聯絡我們 | 屯門前鋒會 幼鋒會" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const send = useServerFn(sendEnquiry);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<TurnstileWidgetId | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (showModal) confirmRef.current?.focus();
  }, [showModal]);

  useEffect(() => {
    let cancelled = false;

    function renderTurnstile() {
      const api = turnstileApi();
      if (cancelled || !turnstileContainer.current || turnstileWidgetId.current !== null || !api) return;
      turnstileWidgetId.current = api.render(turnstileContainer.current, {
        sitekey: TURNSTILE_SITEKEY,
        action: "contact",
        callback: setTurnstileToken,
      });
    }

    if (turnstileApi()) renderTurnstile();

    let script = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderTurnstile);
    return () => {
      cancelled = true;
      script.removeEventListener("load", renderTurnstile);
      const api = turnstileApi();
      if (turnstileWidgetId.current !== null && api) {
        api.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(formData);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setStatus("loading");
    try {
      const result = await send({
        data: { ...formData, "cf-turnstile-response": turnstileToken },
      });
      if (!result.ok) {
        if (result.field) {
          setErrors({ ...EMPTY_ERRORS, [result.field]: result.message });
          setStatus("idle");
          return;
        }
        setStatus("error");
        setMessage(result.message);
        setShowModal(true);
        return;
      }
      setStatus("success");
      setMessage("訊息已成功發送！");
      setFormData(EMPTY_FORM);
      setShowModal(true);
    } catch {
      setStatus("error");
      setMessage("發送訊息時出現錯誤，請稍後再試。");
      setShowModal(true);
    } finally {
      const api = turnstileApi();
      if (turnstileWidgetId.current !== null && api) {
        api.reset(turnstileWidgetId.current);
        setTurnstileToken("");
      }
    }
  };

  return (
    <Shell>
      <section className="contact">
        <div className="contact-heading">
          <h1>聯絡我們</h1>
          <p>我們期待聽到您的聲音</p>
        </div>
        <div className="contact-grid">
          <section className="contact-card">
            <h2>關於我們</h2>
            <div className="contact-facts">
              <div className="contact-fact">
                <MapIcon />
                <div>
                  <h3>地址</h3>
                  <p>
                    屯門山景邨景榮樓21-30號地下
                    <br />
                    山景綜合青少年服務中心
                  </p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=屯門山景邨景榮樓21-30號地下山景綜合青少年服務中心"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalIcon />
                    在 Google 地圖中查看
                  </a>
                </div>
              </div>
              <div className="contact-fact">
                <PhoneIcon />
                <div>
                  <h3>電話</h3>
                  <p>
                    <a href="tel:+85224626122">+852 2462-6122</a>
                    {" / "}
                    <a href="tel:+85265721493">+852 6572-1493</a>
                  </p>
                </div>
              </div>
              <div className="contact-fact">
                <MailIcon />
                <div>
                  <h3>電子郵件</h3>
                  <p>
                    <a href="mailto:info@tuenmunpathfinder.com">info@tuenmunpathfinder.com</a>
                  </p>
                </div>
              </div>
            </div>
            <div className="contact-times">
              <h3>聚會時間</h3>
              <div>
                <p>
                  <span>前鋒會：</span>逢星期六 下午2:30 - 4:30
                </p>
                <p>
                  <span>幼鋒會：</span>逢星期六 下午2:30 - 4:30
                </p>
              </div>
            </div>
          </section>
          <section className="contact-card">
            <h2>聯絡表單</h2>
            <p className="contact-lead">請填寫以下表格，我們會盡快回覆您。</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="contact-trap" aria-hidden="true">
                <label htmlFor="website">網站</label>
                <input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <Field
                id="name"
                label="姓名"
                value={formData.name}
                error={errors.name}
                onChange={(value) => updateField(setFormData, setErrors, "name", value)}
              />
              <Field
                id="email"
                label="電子郵件"
                type="email"
                value={formData.email}
                error={errors.email}
                onChange={(value) => updateField(setFormData, setErrors, "email", value)}
              />
              <Field
                id="phone"
                label="電話號碼"
                type="tel"
                value={formData.phone}
                error={errors.phone}
                onChange={(value) => updateField(setFormData, setErrors, "phone", value)}
              />
              <label className="contact-label" htmlFor="message">
                訊息內容 <span>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                aria-invalid={Boolean(errors.message)}
                onChange={(event) => updateField(setFormData, setErrors, "message", event.target.value)}
              />
              {errors.message ? <p className="contact-error">{errors.message}</p> : null}
              <div className="contact-turnstile" ref={turnstileContainer} />
              <button type="submit" className="contact-submit" disabled={status === "loading" || !turnstileToken}>
                {status === "loading" ? "發送中..." : "發送訊息"}
              </button>
            </form>
          </section>
        </div>
      </section>
      {showModal ? (
        <div className="contact-modal" role="presentation">
          <div
            className={status === "success" ? "contact-dialog is-success" : "contact-dialog is-error"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-dialog-title"
          >
            <button type="button" className="contact-close" onClick={() => setShowModal(false)} aria-label="關閉">
              <CloseIcon />
            </button>
            <div className={status === "success" ? "contact-mark is-success" : "contact-mark is-error"}>
              {status === "success" ? <CheckIcon /> : <CrossIcon />}
            </div>
            <h3 id="contact-dialog-title">{status === "success" ? "成功" : "錯誤"}</h3>
            <p>{message}</p>
            <button
              ref={confirmRef}
              type="button"
              className={status === "success" ? "contact-confirm is-success" : "contact-confirm is-error"}
              onClick={() => setShowModal(false)}
            >
              確定
            </button>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  error,
  onChange,
}: {
  id: FieldName;
  label: string;
  type?: "text" | "email" | "tel";
  value: string;
  error: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className="contact-label" htmlFor={id}>
        {label} <span>*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="contact-error">{error}</p> : null}
    </>
  );
}

function clientAddress(request: Request) {
  const connecting = request.headers.get("cf-connecting-ip")?.trim();
  if (connecting) return connecting;
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "";
  return forwarded.split(",")[0]?.trim() ?? "";
}

function turnstileApi() {
  return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

function updateField(
  setFormData: (value: EnquiryFields | ((current: EnquiryFields) => EnquiryFields)) => void,
  setErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void,
  field: FieldName,
  value: string,
) {
  setFormData((current) => ({ ...current, [field]: value }));
  setErrors((current) => (current[field] ? { ...current, [field]: "" } : current));
}

function validateForm(formData: EnquiryFields): FieldErrors {
  const errors = { ...EMPTY_ERRORS };
  if (!formData.name.trim()) errors.name = "請輸入您的姓名";
  if (!formData.email.trim()) errors.email = "請輸入您的電子郵件";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = "請輸入有效的電子郵件地址";
  }
  if (!formData.phone.trim()) errors.phone = "請輸入您的電話號碼";
  else if (!/^[2-9]\d{7}$/.test(formData.phone.trim())) errors.phone = "請輸入有效的香港電話號碼";
  if (!formData.message.trim()) errors.message = "請輸入您的訊息內容";
  return errors;
}

function MapIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" strokeWidth="1.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6.5 4.8h2.2l1.2 3-1.5 1.1a12.5 12.5 0 0 0 5.7 5.7l1.1-1.5 3 1.2v2.2c0 .7-.6 1.3-1.3 1.3A14.2 14.2 0 0 1 4.2 6.1c0-.7.6-1.3 1.3-1.3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" strokeWidth="1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 13 4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
