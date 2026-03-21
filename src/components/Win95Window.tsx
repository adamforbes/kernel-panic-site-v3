'use client';

import { ReactNode } from 'react';
import styles from './Win95Window.module.css';

interface Win95WindowProps {
  title: string;
  visible: boolean;
  style?: React.CSSProperties;
  children: ReactNode;
  className?: string;
}

export default function Win95Window({ title, visible, style, children, className }: Win95WindowProps) {
  return (
    <div
      className={`${styles.window} ${visible ? styles.windowVisible : ''} ${className || ''}`}
      style={style}
    >
      <div className={styles.titleBar}>
        <span className={styles.titleText}>{title}</span>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
