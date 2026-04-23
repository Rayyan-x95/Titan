import { Bell, Moon, Target, TrendingUp, Users, CircleCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { PreferenceToggle } from '../components/PreferenceToggle';
import type { OnboardingStepProps } from '../types';

function NotificationOption({ icon: Icon, label, description, enabled, onToggle }: {
  icon: ComponentType<LucideProps>;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <PreferenceToggle
      label={label}
      description={description}
      enabled={enabled}
      icon={Icon}
      onToggle={onToggle}
    />
  );
}

export default function PreferencesStep({ profile, onPreferenceChange }: OnboardingStepProps) {
  const notificationSettings = profile.preferences.notificationSettings ?? {
    taskDueDate: true,
    budgetAlert: true,
    taskCompleted: false,
    sharedBalance: true,
  };

  const handleNotificationsToggle = () => {
    const enabled = !profile.preferences.notifications;
    onPreferenceChange({ notifications: enabled });
    if (enabled) {
      onPreferenceChange({
        notificationSettings: {
          taskDueDate: true,
          budgetAlert: true,
          taskCompleted: false,
          sharedBalance: true,
        },
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <NotificationOption
        icon={Bell}
        label="Notifications"
        description="Enable reminder-ready defaults for future local nudges."
        enabled={profile.preferences.notifications}
        onToggle={handleNotificationsToggle}
      />
      {profile.preferences.notifications && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reminder Preferences</p>
          <NotificationOption
            icon={Target}
            label="Task Reminders"
            description="Remind me before tasks are due (1-24 hours)"
            enabled={notificationSettings.taskDueDate}
            onToggle={() => onPreferenceChange({
              notificationSettings: { ...notificationSettings, taskDueDate: !notificationSettings.taskDueDate }
            })}
          />
          <NotificationOption
            icon={TrendingUp}
            label="Budget Alerts"
            description="Warn when budgets reach 85% or more"
            enabled={notificationSettings.budgetAlert}
            onToggle={() => onPreferenceChange({
              notificationSettings: { ...notificationSettings, budgetAlert: !notificationSettings.budgetAlert }
            })}
          />
          <NotificationOption
            icon={CircleCheck}
            label="Task Completion"
            description="Celebrate when you complete tasks"
            enabled={notificationSettings.taskCompleted}
            onToggle={() => onPreferenceChange({
              notificationSettings: { ...notificationSettings, taskCompleted: !notificationSettings.taskCompleted }
            })}
          />
          <NotificationOption
            icon={Users}
            label="Shared Payments"
            description="Notify when a shared expense is detected"
            enabled={notificationSettings.sharedBalance}
            onToggle={() => onPreferenceChange({
              notificationSettings: { ...notificationSettings, sharedBalance: !notificationSettings.sharedBalance }
            })}
          />
        </div>
      )}
      <PreferenceToggle
        label="Dark mode"
        description="Titan opens in a calm dark workspace by default."
        enabled={profile.preferences.darkMode}
        icon={Moon}
        onToggle={() => onPreferenceChange({ darkMode: !profile.preferences.darkMode })}
      />
    </div>
  );
}
