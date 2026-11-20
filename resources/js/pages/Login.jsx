import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ---------- gaya tambahan (font + animasi latar) ---------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=Inter:wght@400;500;600&family=Instrument+Serif:ital@1&display=swap');
.font-logo{font-family:'Outfit',system-ui,sans-serif}
.font-ui{font-family:'Inter',system-ui,sans-serif}
.font-serif-i{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400}
@keyframes drift-a{from{transform:translate(-8%,-6%) scale(1)}to{transform:translate(10%,8%) scale(1.25)}}
@keyframes drift-b{from{transform:translate(8%,6%) scale(1.1)}to{transform:translate(-10%,-8%) scale(.9)}}
.blob-a{animation:drift-a 16s ease-in-out infinite alternate}
.blob-b{animation:drift-b 20s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.blob-a,.blob-b{animation:none}}
`;

/* ---------- latar hijau blur ---------- */
function Backdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070b04]">
      <div className="blob-a absolute -left-1/4 -top-1/4 h-[70%] w-[90%] rounded-full bg-[#6b7a1c] opacity-60 blur-[90px]" />
      <div className="blob-b absolute -right-1/4 top-[8%] h-[55%] w-[85%] rounded-full bg-[#3f6a14] opacity-70 blur-[90px]" />
      <div className="blob-a absolute left-[5%] top-[35%] h-[40%] w-[70%] rounded-full bg-[#2a4a0e] opacity-70 blur-[80px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/90" />
    </div>
  );
}

/* ---------- logo: huruf "MATA" membesar bergantian seperti bernapas ---------- */
function Logo({ className = "", loop = false, delay = 0.6 }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-label="Air Mata Kucing"
      className={`font-logo text-center font-semibold leading-[0.95] tracking-[0.08em] text-white ${className}`}
    >
      <div aria-hidden>
        AIR{" "}
        {"MATA".split("").map((c, i) => (
          <motion.span
            key={i}
            className="inline-block origin-bottom"
            animate={reduce ? undefined : { scale: [1, 1.4, 1], y: [0, -2, 0] }}
            transition={{
              duration: 1.5,
              delay: delay + i * 0.14,
              ease: "easeInOut",
              repeat: loop ? Infinity : 1,
              repeatDelay: loop ? 4 : 0,
            }}
          >
            {c}
          </motion.span>
        ))}
      </div>
      <div aria-hidden>KUCING</div>
    </div>
  );
}

/* ---------- gelombang sinus + titik napas ---------- */
const W = 400, H = 170, MID = 85, AMP = 55, CYCLES = 1.25, PHASE = 0.9 * Math.PI;
const yAt = (x) => MID - AMP * Math.sin((x / W) * Math.PI * 2 * CYCLES + PHASE);
const WAVE_D = Array.from({ length: 101 }, (_, i) => {
  const x = i * 4;
  return `${i ? "L" : "M"}${x} ${yAt(x).toFixed(2)}`;
}).join(" ");

function Wave() {
  const dot = useRef(null);
  const glow = useRef(null);

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      const x = W / 2 - 140 * Math.cos((t * Math.PI * 2) / 12); // bolak-balik, 12 dtk per siklus
      const tr = `translate(${x}px, ${yAt(x)}px)`;
      if (dot.current) dot.current.style.transform = tr;
      if (glow.current) glow.current.style.transform = tr;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="overflow-hidden" aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} className="-mx-[10%] block w-[120%] overflow-visible">
        <motion.path
          d={WAVE_D}
          fill="none"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
        <circle ref={glow} r="16" fill="white" opacity="0.28" />
        <circle ref={dot} r="6" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
}

/* ---------- layar login ---------- */
const rise = (i) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.15 + i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
});

const inputCls =
  "font-ui w-full rounded-full border border-white/15 bg-white/10 px-6 py-4 text-[16px] text-white " +
  "placeholder-white/50 backdrop-blur-md outline-none transition focus:border-white/60 focus:bg-white/15";

export default function LoginScreen({ onLogin, onLoginSuccess }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? "main" : "splash");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(() => setPhase("main"), 3600);
    return () => clearTimeout(t);
  }, [phase]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (onLogin) {
        await onLogin({ username, password });
      } else {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-TOKEN": csrfToken || "",
          },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          onLoginSuccess?.(data.user);
        } else {
          throw new Error(data.message || "Username atau password salah.");
        }
      }
    } catch (err) {
      setError(err?.message || "Username atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#070b04]">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden text-white">
        <style>{css}</style>
        <Backdrop />

        <AnimatePresence mode="wait">
          {phase === "splash" ? (
            <motion.div
              key="splash"
              className="relative flex min-h-[100dvh] items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 0.9 }}
            >
              <Logo className="text-[44px]" />
            </motion.div>
          ) : (
            <motion.main
              key="main"
              className="relative flex min-h-[100dvh] flex-col justify-between px-6 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div {...rise(0)}>
                <Logo className="text-[22px]" loop delay={2.2} />
              </motion.div>

              <Wave />

              <motion.p
                {...rise(2)}
                className="font-ui mx-auto max-w-[19ch] text-center text-[27px] font-semibold leading-[1.15] tracking-tight"
              >
                Semua ada <span className="font-serif-i text-[1.15em]">waktunya</span>, dan setiap
                proses punya <span className="font-serif-i text-[1.15em]">musimnya</span> sendiri.
              </motion.p>

              <motion.form {...rise(3)} onSubmit={submit} className="space-y-3">
                <input
                  className={inputCls}
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && (
                  <p role="alert" className="font-ui text-center text-sm text-red-300">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="font-ui w-full rounded-full bg-white py-4 text-[17px] font-semibold text-black transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Memproses…" : "Masuk"}
                </button>
              </motion.form>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
