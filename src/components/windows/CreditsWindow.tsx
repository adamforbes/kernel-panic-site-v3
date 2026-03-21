import styles from './CreditsWindow.module.css';

export default function CreditsWindow() {
  return (
    <div className={styles.credits}>
      <span className={styles.line}>Designed by Michael Patashnik</span>
      <span className={styles.line}>Art by Adam Forbes</span>
      <span className={styles.line} style={{ marginTop: 8 }}>Published by Red Pup Games</span>
      <span className={`${styles.line} ${styles.copyright}`}>
        &copy; 2026 Red Pup Games. All rights reserved.
      </span>
    </div>
  );
}
