import styles from './BuyWindow.module.css';

export default function BuyWindow() {
  return (
    <div className={styles.buy}>
      <h2 className={styles.productName}>Kernel Panic</h2>
      <p className={styles.price}>$24.99</p>
      <a 
        href="https://redpupgames.square.site/" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.buyButton}
      >
        BUY NOW
      </a>
      <p className={styles.confirmation}>Opens in new tab</p>
    </div>
  );
}
