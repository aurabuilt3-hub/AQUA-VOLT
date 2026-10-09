import React, { useState } from 'react';
import { askCopilot } from '../services/api';
import { CopilotResponse } from '../types';

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEventId: string;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ isOpen, onClose, currentEventId }) => {
  const [question, setQuestion] = useState('Why did AquaVolt defer ice production?');
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (qText?: string) => {
    const qToUse = qText || question;
    if (!qToUse.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await askCopilot({ question: qToUse, context_event_id: currentEventId });
      setResponse(res);
    } catch (err) {
      setResponse(null);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to query Copilot. Ensure backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Why was ice production deferred?",
    "Explain aerator soft-start rig",
    "What is the thermal pre-cooling buffer?",
    "How does AquaVolt protect shrimp stocks?"
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center text-lg shrink-0">
              💬
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AquaVolt Farm Copilot</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-sky-100 border border-white/25">
                  Operational Assistant
                </span>
              </div>
              <p className="text-xs text-sky-100/90 mt-0.5">
                Pond biological safety, microgrid allocation, and equipment queries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs transition"
            title="Close copilot"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/60">
          {/* Suggested Prompts */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Suggested Questions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="text-xs bg-white hover:bg-sky-50 text-sky-800 hover:text-sky-900 hover:border-sky-300 border border-slate-200 px-3 py-1.5 rounded-full transition text-left font-medium shadow-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask AquaVolt about pond DO, aeration, or battery reserve..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium text-slate-800 placeholder:text-slate-400 shadow-xs"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shrink-0 shadow-xs flex items-center gap-1.5"
            >
              {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Analyzing...' : 'Ask Copilot'}</span>
            </button>
          </div>

          {/* Honest Error State */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs space-y-1 shadow-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Copilot Service Notice
              </div>
              <p className="text-rose-600 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Actual Backend Response */}
          {response && (
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                    Operational Intelligence:
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    Source: {response.source}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{response.answer}</p>
              </div>

              {response.recommended_action && (
                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium flex items-start gap-2">
                  <span className="text-teal-700 text-sm">💡</span>
                  <div>
                    <span className="font-bold">Recommendation:</span> {response.recommended_action}
                  </div>
                </div>
              )}

              {response.reasoning_steps && response.reasoning_steps.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1.5 uppercase tracking-wide">
                    Analysis Steps:
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {response.reasoning_steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-center gap-1.5">
                        <span className="text-teal-600 font-bold">✓</span> {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>AquaVolt Intelligence · Grounded in Facility Telemetry</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
