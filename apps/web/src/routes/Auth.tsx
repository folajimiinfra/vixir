import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

type Tab = 'signin' | 'create';
type Role = 'student' | 'teacher' | 'admin';

export function Auth() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'create' ? 'create' : 'signin';
  const initialRole = (searchParams.get('role') as Role) || 'student';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const nextRoute = searchParams.get('next');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (nextRoute) {
      navigate(nextRoute);
      return;
    }
    if (email.toLowerCase().includes('teacher') || email.toLowerCase().includes('bello')) {
      navigate('/teacher');
    } else if (email.toLowerCase().includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/app');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (password && password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
    if (nextRoute) {
      navigate(nextRoute);
      return;
    }
    if (role === 'student') navigate('/app');
    else if (role === 'teacher') navigate('/teacher');
    else navigate('/admin');
  };

  const getCodeFieldLabel = () => {
    if (role === 'student') return 'Class code';
    if (role === 'teacher') return 'Department invite code';
    return 'Institution setup code';
  };

  const getCodePlaceholder = () => {
    if (role === 'student') return 'e.g. PHY-SS3-7KQ2';
    if (role === 'teacher') return 'e.g. DEPT-PHY-2026';
    return 'e.g. INST-KCL-2026';
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F5F7FA]">
      {/* Left dark panel */}
      <div className="lg:col-span-6 bg-[#0B1220] text-[#E6EBF5] p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/illustrations/logo.svg"
              alt=""
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Vixir
            </span>
          </Link>
        </div>

        <div className="my-12 lg:my-0 max-w-lg">
          <h1 className="font-display text-4xl sm:text-[44px] font-bold text-white leading-[1.12] tracking-tight mb-4">
            Your lab bench is ready.
          </h1>
          <p className="text-base text-[#93A0B8] leading-relaxed mb-7">
            Sign in with the account your school or department created, or join a class with the
            code your teacher gave you.
          </p>

          <div className="bg-[#121A2B] border border-[#22304A] rounded-2xl p-5 font-mono text-xs sm:text-sm space-y-1.5">
            <div>
              <span className="text-[#FDBA74]">g</span>
              <span className="text-[#C9D3E6]"> = 4π² / slope</span>
            </div>
            <div className="text-[#C9D3E6]">slope (T² vs L) = 4.02 s² m⁻¹</div>
            <div className="text-[#4ADE80]">g = 9.82 m s⁻² ✓ within 2%</div>
          </div>
        </div>

        <div className="text-xs text-[#6B778C]">
          Works offline once installed · Data stays with your institution
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px]">
          {/* Segmented Pill Toggle */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="bg-[#E8ECF2] p-1 rounded-xl grid grid-cols-2 mb-7"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => setTab('signin')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white text-[#0E1726] shadow-xs'
                  : 'text-[#475467] hover:text-[#0E1726]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'create'}
              onClick={() => setTab('create')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                tab === 'create'
                  ? 'bg-white text-[#0E1726] shadow-xs'
                  : 'text-[#475467] hover:text-[#0E1726]'
              }`}
            >
              Create account
            </button>
          </div>

          {tab === 'signin' ? (
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-6">
                Welcome back
              </h2>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Email or matric / admission number
                  </label>
                  <input
                    id="signin-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. 2025/PHY/0142"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#0E1726]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 text-[#0E1726] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="rounded border-[#D0D7E2] text-[#2448D8] focus:ring-[#2448D8]"
                    />
                    <span>Keep me signed in on this device</span>
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={(e) => e.preventDefault()}
                    className="text-[#2448D8] hover:underline font-medium"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors mt-2"
                >
                  Sign in
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E3E8EF]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#F5F7FA] text-[#6B778C]">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/app')}
                className="w-full py-3 rounded-xl bg-white hover:bg-[#EDF1F7] border border-[#D0D7E2] text-[#0E1726] text-sm font-semibold transition-colors"
              >
                Continue with Google
              </button>

              <div className="mt-6 text-center">
                <Link
                  to="/teacher"
                  className="text-xs font-medium text-[#2448D8] hover:underline"
                >
                  Signing in as a teacher? Go to teacher view →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0E1726] mb-5">
                Create your account
              </h2>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1726] mb-1.5">
                    I am a...
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['student', 'teacher', 'admin'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all capitalize ${
                          role === r
                            ? 'bg-[#EAEFFE] border-2 border-[#2448D8] text-[#2448D8]'
                            : 'bg-white border-[#D0D7E2] text-[#0E1726] hover:bg-[#EDF1F7]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="create-name"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="create-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adaeze Okafor"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-email"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu.ng"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-code"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    {getCodeFieldLabel()}
                  </label>
                  <input
                    id="create-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={getCodePlaceholder()}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm font-mono text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-password"
                    className="block text-xs font-semibold text-[#0E1726] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="create-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D0D7E2] rounded-xl text-sm text-[#0E1726] placeholder:text-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#2448D8] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B778C] hover:text-[#0E1726]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#C4321C]">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#2448D8] hover:bg-[#1B38B0] text-white text-sm font-semibold transition-colors mt-2"
                >
                  Create account
                </button>

                <p className="text-xs text-[#475467] leading-relaxed pt-1">
                  By continuing you agree to the Terms and Privacy Policy. Students under 18 are
                  registered by their school.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
