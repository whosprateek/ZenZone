import React from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const sentimentOrder = ['positive', 'neutral', 'negative', 'concerning'];
const sentimentColors = {
  positive: '#22c55e',
  neutral: '#64748b',
  negative: '#ef4444',
  concerning: '#9333ea',
};

const sentimentToScore = (s) => ({ positive: 1, neutral: 0, negative: -1, concerning: -2 }[s] ?? 0);

export default function AIChatReport({ stats, timeline, onSave, onReset, sessionId }) {
  const sentiments = sentimentOrder.map((k) => stats.sentiments[k] || 0);

  const doughnutData = {
    labels: sentimentOrder.map((s) => s[0].toUpperCase() + s.slice(1)),
    datasets: [
      {
        data: sentiments,
        backgroundColor: sentimentOrder.map((s) => sentimentColors[s]),
        borderWidth: 1,
      },
    ],
  };

  const intentsSorted = Object.entries(stats.intents || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const barData = {
    labels: intentsSorted.map(([k]) => k),
    datasets: [
      {
        label: 'Mentions',
        data: intentsSorted.map(([, v]) => v),
        backgroundColor: '#0ea5e9',
      },
    ],
  };

  const lineData = {
    labels: timeline.map((_, i) => `Msg ${i + 1}`),
    datasets: [
      {
        label: 'Sentiment over time',
        data: timeline.map((s) => sentimentToScore(s)),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.2)',
        tension: 0.25,
      },
    ],
  };

  const noData = (arr) => arr.every((v) => v === 0);

  const exportSection = async (asPdf = false) => {
    const el = document.querySelector('.ai-report');
    if (!el) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const dataUrl = canvas.toDataURL('image/png');
    if (!asPdf) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `chat-report-${sessionId || 'session'}.png`;
      link.click();
    } else {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pageWidth - 20; // margins
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
      pdf.save(`chat-report-${sessionId || 'session'}.pdf`);
    }
  };

  return (
    <div className="ai-report">
      <div className="ai-report-toolbar">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => exportSection(false)}>
          Export PNG
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => exportSection(true)}>
          Export PDF
        </button>
        {onSave && (
          <button className="btn btn-sm btn-primary" onClick={onSave}>
            Save Report
          </button>
        )}
        {onReset && (
          <button className="btn btn-sm btn-danger" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      <h4 className="ai-report-title">Conversation Insights</h4>
      <div className="ai-report-categories">
        {Object.entries(stats.intents || {}).length === 0 ? (
          <span>No categories yet.</span>
        ) : (
          Object.entries(stats.intents)
            .sort((a,b)=>b[1]-a[1])
            .map(([k,v]) => (
              <span key={k} className="badge rounded-pill bg-light text-dark me-2 mb-2">
                <i className={`bi ${{
                  anxiety:'bi-emoji-dizzy',
                  depression:'bi-emoji-frown',
                  stress:'bi-lightning-charge',
                  sleep:'bi-moon-stars',
                  relationships:'bi-people',
                  academic:'bi-journal-text',
                  positive:'bi-emoji-smile',
                  greeting:'bi-hand-thumbs-up',
                  help:'bi-question-circle',
                  crisis:'bi-exclamation-triangle'
                }[k] || 'bi-chat-dots'}`} />
                <span className="ms-1">{k}:</span> <strong className="ms-1">{v}</strong>
              </span>
            ))
        )}
      </div>
      <div className="ai-report-grid">
        <div className="ai-report-card">
          <h5>Sentiment Distribution</h5>
          {noData(sentiments) ? <p>No sentiment data yet.</p> : <Doughnut data={doughnutData} />}
        </div>
        <div className="ai-report-card">
          <h5>Top Topics/Intents</h5>
          {intentsSorted.length === 0 ? <p>No topic data yet.</p> : <Bar data={barData} />}
        </div>
        <div className="ai-report-card span-2">
          <h5>Sentiment Timeline</h5>
          {timeline.length === 0 ? <p>Start chatting to see the timeline.</p> : <Line data={lineData} />}
        </div>
      </div>
    </div>
  );
}
