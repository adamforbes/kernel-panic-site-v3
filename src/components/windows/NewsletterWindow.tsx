'use client';

import styles from './NewsletterWindow.module.css';

export default function NewsletterWindow() {
  return (
    <div className={styles.newsletter}>
      <div className={styles.prompt}>
        {`> enter email to receive patch notes_`}
      </div>
      <div className={styles.inputRow}>
        <input
          type="email"
          className={styles.input}
          placeholder="user@kernel.panic"
        />
        <button className={styles.submitButton}>Install</button>
      </div>
    </div>
  );
}
