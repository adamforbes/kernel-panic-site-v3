import styles from './LogoWindow.module.css';

export default function LogoWindow() {
  return (
    <div className={styles.logo}>
      <h1 className={styles.title}>
        KERNEL<br />PANIC
      </h1>
    </div>
  );
}
