import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Layout } from '@/app/Layout';
import { useStore } from '@/core/store';
import { useSettings } from '@/core/settings';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const TasksPage = lazy(() => import('@/features/tasks').then((m) => ({ default: m.TasksPage })));
const NotesPage = lazy(() => import('@/features/notes').then((m) => ({ default: m.NotesPage })));
const FinancePage = lazy(() =>
  import('@/features/finance').then((m) => ({ default: m.FinancePage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings').then((m) => ({ default: m.SettingsPage })),
);
const ShareTargetPage = lazy(() =>
  import('@/features/share').then((m) => ({ default: m.ShareTargetPage })),
);
const OnboardingPage = lazy(() =>
  import('@/features/onboarding').then((m) => ({ default: m.OnboardingPage })),
);
const TimelinePage = lazy(() =>
  import('@/features/timeline').then((m) => ({ default: m.TimelineView })),
);
const SplitPage = lazy(() => import('@/features/split').then((m) => ({ default: m.SplitPage })));
const LandingPage = lazy(() =>
  import('@/features/landing').then((m) => ({ default: m.LandingPage })),
);

// Marketing Pages
const MarketingLanding = lazy(() =>
  import('@/features/marketing/MarketingLanding').then((m) => ({ default: m.MarketingLanding })),
);
const FeaturesPage = lazy(() =>
  import('@/features/marketing/FeaturesPage').then((m) => ({ default: m.FeaturesPage })),
);
const TaskManagerPage = lazy(() =>
  import('@/features/marketing/TaskManagerPage').then((m) => ({ default: m.TaskManagerPage })),
);
const ExpenseTrackerPage = lazy(() =>
  import('@/features/marketing/ExpenseTrackerPage').then((m) => ({
    default: m.ExpenseTrackerPage,
  })),
);
const SharedExpensesPage = lazy(() =>
  import('@/features/marketing/SharedExpensesPage').then((m) => ({
    default: m.SharedExpensesPage,
  })),
);
const LifeTimelinePage = lazy(() =>
  import('@/features/marketing/LifeTimelinePage').then((m) => ({ default: m.LifeTimelinePage })),
);
const InstallPage = lazy(() =>
  import('@/features/marketing/InstallPage').then((m) => ({ default: m.InstallPage })),
);
const BlogPage = lazy(() =>
  import('@/features/marketing/BlogPage').then((m) => ({ default: m.BlogPage })),
);
const BlogPost = lazy(() =>
  import('@/features/marketing/BlogPost').then((m) => ({ default: m.BlogPost })),
);
const PrivacyPage = lazy(() =>
  import('@/features/marketing/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import('@/features/marketing/TermsPage').then((m) => ({ default: m.TermsPage })),
);

// SEO Specific Landing Pages
const PersonalLifeOSPage = lazy(() =>
  import('@/features/marketing/PersonalLifeOSPage').then((m) => ({
    default: m.PersonalLifeOSPage,
  })),
);
const SplitExpensesAppPage = lazy(() =>
  import('@/features/marketing/SplitExpensesAppPage').then((m) => ({
    default: m.SplitExpensesAppPage,
  })),
);
const WhatIsTitanPage = lazy(() =>
  import('@/features/marketing/WhatIsTitanPage').then((m) => ({ default: m.WhatIsTitanPage })),
);
const LifeManagementAppPage = lazy(() =>
  import('@/features/marketing/LifeManagementAppPage').then((m) => ({
    default: m.LifeManagementAppPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/features/error/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function OnboardingGate() {
  const hydrated = useStore((state) => state.hydrated);
  const onboarding = useStore((state) => state.onboarding);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasResolvedOnboarding = Boolean(onboarding.completedAt || onboarding.skippedAt);

  if (!hasResolvedOnboarding) {
    return <Navigate to="/welcome" replace />;
  }

  return <Layout />;
}

export default function App() {
  const animations = useSettings((s) => s.animations);

  return (
    <ErrorBoundary>
      <MotionConfig
        transition={animations ? undefined : { duration: 0 }}
        reducedMotion={animations ? 'user' : 'always'}
      >
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
              Loading...
            </div>
          }
        >
          <Routes>
            {/* Marketing Routes */}
            <Route path="home" element={<MarketingLanding />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="ai-task-manager" element={<TaskManagerPage />} />
            <Route path="expense-tracker" element={<ExpenseTrackerPage />} />
            <Route path="shared-expenses" element={<SharedExpensesPage />} />
            <Route path="life-timeline" element={<LifeTimelinePage />} />
            <Route path="install-titan" element={<InstallPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />

            {/* SEO Targeted Routes */}
            <Route path="personal-life-os" element={<PersonalLifeOSPage />} />
            <Route path="split-expenses-app" element={<SplitExpensesAppPage />} />
            <Route path="what-is-titan" element={<WhatIsTitanPage />} />
            <Route path="life-management-app" element={<LifeManagementAppPage />} />

            {/* Legacy / App Routes */}
            <Route path="welcome" element={<LandingPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />

            <Route path="/" element={<OnboardingGate />}>
              <Route index element={<DashboardPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="split" element={<SplitPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="share" element={<ShareTargetPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </MotionConfig>
    </ErrorBoundary>
  );
}
