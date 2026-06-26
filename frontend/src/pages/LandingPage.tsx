import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ROUTES } from '../constants';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

/**
 * LandingPage — Trang chủ giới thiệu Studifier (Mockup 1).
 * Thiết kế cao cấp với mesh gradient, góc bo tròn mềm mại và chuyển động mượt mà.
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: settings } = useSettings();

  const webName = settings?.web_name || 'Studifier';
  const footerText = settings?.footer || `Studifier &copy; ${new Date().getFullYear()} &bull; AI Learning Ecosystem`;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const steps = [
    {
      num: 1,
      title: 'Upload Documents',
      desc: 'Drop your PDFs, slides, or notes into the platform.',
      bg: 'bg-indigo-50 text-indigo-600',
    },
    {
      num: 2,
      title: 'AI Processing',
      desc: 'Our engine analyzes and organizes your study materials instantly.',
      bg: 'bg-violet-50 text-violet-600',
    },
    {
      num: 3,
      title: 'Interactive Learning',
      desc: 'Chat with your documents, generate quizzes, and master topics faster.',
      bg: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/20 text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden selection:bg-indigo-100">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/40 to-violet-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-100/30 to-indigo-100/30 blur-[120px] pointer-events-none" />

      {/* Top Header Logo */}
      <header className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 shrink-0 z-10 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-black text-indigo-600 tracking-tight">{webName}</span>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest pl-0.5">
            AI LEARNING
          </span>
        </div>

        {/* Small Navigation for Quick Entry */}
        <div>
          <button
            onClick={handleGetStarted}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-transparent border-0 outline-none cursor-pointer"
          >
            {isAuthenticated ? 'Go to Workspace' : 'Sign In'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 py-12 md:py-24 z-10 flex-1 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Column (Brand Slogan & Call-to-action) */}
        <div className="flex-1 space-y-8 text-left max-w-xl">
          <div className="space-y-4">
            <h2 className="text-[36px] md:text-[56px] font-black text-indigo-600 leading-none tracking-tight">
              {webName}
            </h2>
            <h1 className="text-[28px] md:text-[44px] font-extrabold text-slate-800 leading-tight tracking-tight">
              Your Premium AI Learning Partner
            </h1>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium max-w-md pt-2">
              Elevate your study experience with intelligent tools designed for focus, clarity, and rapid mastery.
            </p>
          </div>

          <div>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg shadow-indigo-600/20 outline-none border-0 cursor-pointer group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Right Column (How to Use Guide Card) */}
        <div className="w-full md:w-[460px] shrink-0">
          <div className="bg-white/85 border border-slate-100 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(99,102,241,0.05)] backdrop-blur-md">
            <h3 className="text-xl font-bold text-slate-800 mb-8 tracking-tight">
              How to use
            </h3>

            {/* List of Steps */}
            <div className="space-y-6">
              {steps.map(({ num, title, desc, bg }) => (
                <div key={num} className="flex gap-4 items-start group">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm ${bg} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                    {num}
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <h4 className="text-sm font-bold text-slate-800 leading-none">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer External Link */}
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
              <a
                href="#docs"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline group"
              >
                View full documentation
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Branding Copyright */}
      <footer
        className="max-w-7xl mx-auto w-full px-6 md:px-12 py-6 text-center text-xs font-semibold text-slate-400 shrink-0 z-10"
        dangerouslySetInnerHTML={{ __html: footerText }}
      />

    </div>
  );
};

export default LandingPage;
