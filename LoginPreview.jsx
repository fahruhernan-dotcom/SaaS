import { useState } from "react";

const EyeIcon = ({ show }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111827",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .a1 { animation: fadeUp 0.45s ease both; }
        .a2 { animation: fadeUp 0.45s 0.08s ease both; }
        .a3 { animation: fadeUp 0.45s 0.16s ease both; }
        .a4 { animation: fadeUp 0.45s 0.24s ease both; }
        .a5 { animation: fadeUp 0.45s 0.32s ease both; }
        .a6 { animation: fadeUp 0.45s 0.40s ease both; }
        .a7 { animation: fadeUp 0.45s 0.48s ease both; }
        .gbtn { transition: background 0.2s; }
        .gbtn:hover { background: #1c2533 !important; }
        .gbtn:active { transform: scale(0.98); }
        .uinput {
          width: 100%; background: transparent;
          border: none; border-bottom: 1.5px solid #2d3748;
          padding: 10px 36px; color: #e2e8f0;
          font-size: 15px; font-family: inherit;
          outline: none; box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .uinput:focus { border-bottom-color: #22c55e; }
        .uinput::placeholder { color: #4a5568; }
        .iwrap { position: relative; }
        .ileft { position: absolute; left: 0; top: 50%; transform: translateY(-50%); color: #4a5568; pointer-events: none; }
        .iright { position: absolute; right: 0; top: 50%; transform: translateY(-50%); color: #4a5568; cursor: pointer; background: none; border: none; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
        .iright:hover { color: #22c55e; }
        .mbtn { width: 100%; padding: 14px; background: #22c55e; border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.2s, transform 0.1s; letter-spacing: 0.01em; }
        .mbtn:hover { background: #16a34a; }
        .mbtn:active { transform: scale(0.98); }
        .dbtn { width: 100%; padding: 13px; background: transparent; border: 1.5px solid #2d3748; border-radius: 12px; color: #a3a3a3; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.2s; }
        .dbtn:hover { border-color: #22c55e; color: #22c55e; }
        .dbtn:active { transform: scale(0.98); }
        .lupabtn { color: #22c55e; font-size: 13px; font-weight: 500; text-decoration: none; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
        .lupabtn:hover { text-decoration: underline; }
        input[type=checkbox] { accent-color: #22c55e; cursor: pointer; width: 15px; height: 15px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 390, background: "#0d1117", minHeight: "100vh", overflow: "hidden" }}>

        {/* Hero */}
        <div style={{ position: "relative" }}>
          <div style={{ background: "linear-gradient(150deg, #14532d 0%, #166534 60%, #15803d 100%)", padding: "50px 28px 76px", position: "relative", overflow: "hidden" }}>
            {/* Circles pattern */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09 }} viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice">
              <circle cx="330" cy="30" r="100" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="330" cy="30" r="65" fill="none" stroke="white" strokeWidth="1"/>
              <circle cx="330" cy="30" r="32" fill="none" stroke="white" strokeWidth="0.8"/>
              <circle cx="-30" cy="195" r="110" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="-30" cy="195" r="70" fill="none" stroke="white" strokeWidth="1"/>
            </svg>

            <div className="a1" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "white", flexShrink: 0 }}>T</div>
              <span style={{ color: "white", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>TernakOS</span>
            </div>

            <div className="a2">
              <h1 style={{ color: "white", margin: "0 0 8px", fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em" }}>
                Selamat datang<br/>kembali 👋
              </h1>
              <p style={{ color: "#86efac", margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Masuk untuk kelola ternak kamu
              </p>
            </div>
          </div>

          {/* Wave */}
          <svg viewBox="0 0 390 56" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 56, marginTop: -1 }}>
            <path d="M0,0 C70,56 160,0 260,38 C320,60 370,18 390,0 L390,56 L0,56 Z" fill="#0d1117"/>
          </svg>
        </div>

        {/* Form */}
        <div style={{ padding: "0 28px 36px", marginTop: -12 }}>

          <div className="a3">
            <button className="gbtn" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px", background: "#161b22", border: "1.5px solid #2d3748", borderRadius: 12, color: "#e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <GoogleIcon />
              Masuk dengan Google
            </button>
          </div>

          <div className="a4" style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#2d3748" }} />
            <span style={{ color: "#4a5568", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>ATAU</span>
            <div style={{ flex: 1, height: 1, background: "#2d3748" }} />
          </div>

          <div className="a4" style={{ marginBottom: 22 }}>
            <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.08em" }}>EMAIL</label>
            <div className="iwrap">
              <span className="ileft"><MailIcon /></span>
              <input className="uinput" type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="a5" style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#6b7280", fontSize: 11, fontWeight: 600, marginBottom: 6, letterSpacing: "0.08em" }}>PASSWORD</label>
            <div className="iwrap">
              <span className="ileft"><LockIcon /></span>
              <input className="uinput" type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} />
              <button className="iright" onClick={() => setShowPassword(!showPassword)}><EyeIcon show={showPassword} /></button>
            </div>
          </div>

          <div className="a6" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span style={{ color: "#9ca3af", fontSize: 13 }}>Ingat saya</span>
            </label>
            <button className="lupabtn">Lupa password?</button>
          </div>

          <div className="a6" style={{ marginBottom: 10 }}>
            <button className="mbtn">Masuk</button>
          </div>

          <div className="a7" style={{ textAlign: "center", margin: "14px 0 10px", color: "#4a5568", fontSize: 13 }}>
            Belum punya akun?
          </div>

          <div className="a7">
            <button className="dbtn">Daftar Sekarang — Gratis 14 Hari</button>
          </div>

          <p style={{ textAlign: "center", color: "#374151", fontSize: 12, marginTop: 18, lineHeight: 1.6 }}>
            Dengan masuk, kamu menyetujui{" "}
            <a href="#" style={{ color: "#22c55e", textDecoration: "none" }}>Syarat & Ketentuan</a>
            {" "}dan{" "}
            <a href="#" style={{ color: "#22c55e", textDecoration: "none" }}>Kebijakan Privasi</a> kami.
          </p>
        </div>
      </div>
    </div>
  );
}
