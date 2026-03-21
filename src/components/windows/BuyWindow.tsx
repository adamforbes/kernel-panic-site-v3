import styles from './BuyWindow.module.css';

export default function BuyWindow() {
  return (
    <div className={styles.buy}>
      <h2 className={styles.productName}>Kernel Panic</h2>
      <p className={styles.price}>$24.99</p>
      <button className={styles.buyButton}>BUY NOW</button>
      <p className={styles.confirmation}>Are you sure you want to purchase?</p>
    </div>
  );
}
