import styles from './PitchWindow.module.css';

export default function PitchWindow() {
  return (
    <div className={styles.pitch}>
      <p className={styles.tagline}>
        A real-time puzzle game of chaotically concurrent computation
      </p>
    </div>
  );
}
