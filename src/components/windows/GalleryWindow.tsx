import styles from './GalleryWindow.module.css';

const cards = [
  {
    name: 'Rotate',
    symbol: '↻',
    rule: 'Swap the digits of one of your counters.',
    example: 'Ex: 13 → 31, 08 → 80',
    type: 'Statement',
    rotation: -8,
    offset: { x: 0, y: 0 },
  },
  {
    name: 'Increment',
    symbol: '++',
    rule: 'Add 1 to any single digit on one of your counters.',
    example: 'Ex: 13 → 14, 09 → 00',
    type: 'Statement',
    rotation: 3,
    offset: { x: 30, y: 10 },
  },
  {
    name: 'Fork',
    symbol: '⑂',
    rule: 'Copy one of your counters onto an empty slot.',
    example: 'Ex: 42 → 42, 42',
    type: 'Statement',
    rotation: -2,
    offset: { x: 60, y: -5 },
  },
  {
    name: 'Halt',
    symbol: '⏹',
    rule: 'Lock one counter. It cannot be modified this round.',
    example: '',
    type: 'Interrupt',
    rotation: 6,
    offset: { x: 90, y: 15 },
  },
];

export default function GalleryWindow() {
  return (
    <div className={styles.gallery}>
      <div className={styles.cardStack}>
        {cards.map((card, i) => (
          <div
            key={card.name}
            className={styles.card}
            style={{
              transform: `rotate(${card.rotation}deg) translate(${card.offset.x}px, ${card.offset.y}px)`,
              zIndex: i + 1,
              left: 0,
              top: 0,
            }}
          >
            <div className={styles.cardTitleBar}>{card.name}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardArt}>
                <span className={styles.pixelArt}>{card.symbol}</span>
              </div>
              <div className={styles.cardText}>
                <span>{card.rule}</span>
                {card.example && (
                  <span className={styles.cardExample}>{card.example}</span>
                )}
              </div>
            </div>
            <div className={styles.cardType}>{card.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
