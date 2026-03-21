'use client';

import { useState } from 'react';
import styles from './TutorialWindow.module.css';

const steps = [
  {
    title: 'Deal the Cards',
    text: 'Each player gets a hand of Statement cards. These are your tools — swap digits, increment values, fork counters.',
  },
  {
    title: 'Set Your Target',
    text: 'A target number is revealed. All players race simultaneously to reach it by playing cards on their counters.',
  },
  {
    title: 'Play in Real-Time',
    text: 'No turns. Play cards as fast as you can. Every card modifies your counters — rotate digits, add values, copy numbers.',
  },
  {
    title: 'Reach the Target',
    text: 'First player to match the target number across their counters wins the round. It\'s chaotic. It\'s concurrent. It\'s a kernel panic.',
  },
];

interface TutorialWindowProps {
  onTitleUpdate?: (title: string) => void;
}

export default function TutorialWindow({ onTitleUpdate }: TutorialWindowProps) {
  const [step, setStep] = useState(0);

  const goNext = () => {
    if (step < steps.length - 1) {
      const newStep = step + 1;
      setStep(newStep);
      onTitleUpdate?.(`setup_wizard.exe — Step ${newStep + 1} of ${steps.length}`);
    }
  };

  const goBack = () => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      onTitleUpdate?.(`setup_wizard.exe — Step ${newStep + 1} of ${steps.length}`);
    }
  };

  return (
    <div className={styles.tutorial}>
      <div className={styles.stepHeader}>
        Installing knowledge... Step {step + 1} of {steps.length}
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className={styles.stepContent}>
        <h3 className={styles.stepTitle}>{steps[step].title}</h3>
        <p className={styles.stepText}>{steps[step].text}</p>
      </div>
      <div className={styles.nav}>
        <button
          className={`${styles.navButton} ${step === 0 ? styles.navButtonDisabled : ''}`}
          onClick={goBack}
          disabled={step === 0}
        >
          &lt; Back
        </button>
        <button
          className={`${styles.navButton} ${step === steps.length - 1 ? styles.navButtonDisabled : ''}`}
          onClick={goNext}
          disabled={step === steps.length - 1}
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}
