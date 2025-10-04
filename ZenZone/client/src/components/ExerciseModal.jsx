import React, { useEffect, useMemo, useState } from 'react';
import './ExerciseModal.css';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const BreathingExercise = ({ onClose }) => {
  const phases = [
    { label: 'Inhale', seconds: 4 },
    { label: 'Hold', seconds: 7 },
    { label: 'Exhale', seconds: 8 },
  ];
  const [cycle, setCycle] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].seconds);
  const totalCycles = 3;

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // next phase
        if (phaseIndex < phases.length - 1) {
          setPhaseIndex((i) => i + 1);
          return phases[phaseIndex + 1].seconds;
        }
        // next cycle
        if (cycle < totalCycles) {
          setPhaseIndex(0);
          setCycle((c) => c + 1);
          return phases[0].seconds;
        }
        clearInterval(id);
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phaseIndex, phases, cycle]);

  const progress = useMemo(() => {
    const total = totalCycles * phases.reduce((a, p) => a + p.seconds, 0);
    const doneCycles = (cycle - 1) * phases.reduce((a, p) => a + p.seconds, 0);
    const currentPhaseDone = phases[phaseIndex].seconds - secondsLeft;
    return clamp(Math.round(((doneCycles + currentPhaseDone) / total) * 100), 0, 100);
  }, [cycle, phaseIndex, secondsLeft, phases]);

  const phase = phases[phaseIndex];
  const completed = cycle > totalCycles || (cycle === totalCycles && phaseIndex === phases.length - 1 && secondsLeft === 0);

  return (
    <div className="exercise-body">
      <h4>4-7-8 Breathing</h4>
      <p className="text-muted">Cycle {Math.min(cycle, totalCycles)} of {totalCycles}</p>
      <div className={`phase-badge ${phase.label.toLowerCase()}`}>{phase.label}</div>
      <div className="big-counter">{completed ? 'Done' : secondsLeft}</div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="exercise-actions">
        <button className="btn btn-light" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const PmrExercise = ({ onClose }) => {
  const steps = [
    'Hands & Forearms',
    'Biceps & Shoulders',
    'Face & Jaw',
    'Chest & Abdomen',
    'Back',
    'Quads & Calves',
    'Ankles & Feet',
  ];
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [index]);

  useEffect(() => {
    if (seconds === 0 && index < steps.length - 1) {
      setIndex((i) => i + 1);
      setSeconds(10);
    }
  }, [seconds, index, steps.length]);

  const done = index === steps.length - 1 && seconds === 0;

  return (
    <div className="exercise-body">
      <h4>Progressive Muscle Relaxation</h4>
      <p className="text-muted">Tense for 5s, then slowly release.</p>
      <div className="pmr-step">
        <span className="step-index">Step {index + 1} / {steps.length}</span>
        <h5>{steps[index]}</h5>
      </div>
      <div className="big-counter">{done ? 'Done' : seconds}</div>
      <div className="exercise-actions">
        <button className="btn btn-light" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MindfulnessExercise = ({ onClose }) => {
  const totalSeconds = 120; // 2 minutes
  const [seconds, setSeconds] = useState(totalSeconds);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const minutes = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  const progress = clamp(Math.round(((totalSeconds - seconds) / totalSeconds) * 100), 0, 100);
  return (
    <div className="exercise-body">
      <h4>Mindfulness Meditation</h4>
      <p className="text-muted">Focus on your breath. If your mind wanders, gently bring it back.</p>
      <div className="big-counter">{minutes}:{secs}</div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="exercise-actions">
        <button className="btn btn-light" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default function ExerciseModal({ open, exercise, onClose }) {
  if (!open || !exercise) return null;
  const type = (exercise.type || '').toLowerCase();
  return (
    <div className="exercise-overlay" role="dialog" aria-modal="true">
      <div className="exercise-modal">
        <button className="btn-close-exercise" onClick={onClose} aria-label="Close">
          <i className="bi bi-x-lg" />
        </button>
        {type.includes('breathing') && <BreathingExercise onClose={onClose} />}
        {type.includes('body') && <PmrExercise onClose={onClose} />}
        {type.includes('meditation') && <MindfulnessExercise onClose={onClose} />}
        {!type && (
          <div className="exercise-body">
            <h4>{exercise.title}</h4>
            <p className="text-muted">No guided flow for this exercise yet.</p>
            <div className="exercise-actions">
              <button className="btn btn-light" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}