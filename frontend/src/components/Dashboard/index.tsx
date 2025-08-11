import React from 'react';
import { User, Project, Timesheet } from '../../types';
import styles from './index.module.css';

interface DashboardStats {
  totalHoursThisWeek: number;
  activeProjects: number;
  completedTimesheets: number;
}

interface DashboardProps {
  user: User | null;
  projects: Project[];
  timesheets: Timesheet[];
  loading: boolean;
  error: string;
  stats: DashboardStats;
  onCompleteProject?: (projectId: number) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  projects,
  timesheets,
  loading,
  error,
  stats,
  onCompleteProject,
}) => {
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.name}!</h1>
        <p className={styles.subtitle}>Here's your timesheet overview</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalHoursThisWeek}</div>
          <div className={styles.statLabel}>Hours This Week</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.activeProjects}</div>
          <div className={styles.statLabel}>Active Projects</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.completedTimesheets}</div>
          <div className={styles.statLabel}>Completed Timesheets</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Active Projects</h2>
          </div>
          <div className={styles.cardContent}>
            {projects.length > 0 ? (
              <div className={styles.projectsList}>
                {projects.map((project) => (
                  <div key={project.id} className={styles.projectItem}>
                    <div className={styles.projectInfo}>
                      <div className={styles.projectName}>
                        {project.client_name} - {project.project_name}
                      </div>
                      <div className={styles.projectMeta}>
                        {project.work_type} • {project.location}
                      </div>
                    </div>
                    {onCompleteProject && (
                      <button
                        onClick={() => onCompleteProject(project.id)}
                        className={styles.completeButton}
                        title="Mark project as completed"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>No active projects</div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Timesheets</h2>
          </div>
          <div className={styles.cardContent}>
            {timesheets.length > 0 ? (
              <div className={styles.timesheetsList}>
                {timesheets.slice(0, 5).map((timesheet) => (
                  <div key={timesheet.id} className={styles.timesheetItem}>
                    <div className={styles.timesheetInfo}>
                      <div className={styles.timesheetProject}>
                        {timesheet.project_name}
                      </div>
                      <div className={styles.timesheetWeek}>
                        Week of {new Date(timesheet.week_start).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.timesheetHours}>
                      {timesheet.total_hours}h
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>No timesheets found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;