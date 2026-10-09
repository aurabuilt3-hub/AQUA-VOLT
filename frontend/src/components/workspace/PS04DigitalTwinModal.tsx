import React from 'react';
import { ActionPlan, IoTTelemetry } from '../../types';
import { PS04DigitalTwin } from '../PS04DigitalTwin';

interface PS04DigitalTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ActionPlan | null;
  telemetry?: IoTTelemetry | null;
  twinState?: any;
}

export const PS04DigitalTwinModal: React.FC<PS04DigitalTwinModalProps> = ({
  isOpen,
  onClose,
  plan,
  telemetry,
  twinState,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-command-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-command-950 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-command-700 overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-command-900 flex items-center justify-between border-b border-command-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-command-800 border border-command-700 text-petrol-400 flex items-center justify-center text-xs font-mono font-bold">
              SCADA
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                  Digital Twin Facility Console
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Simulated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Digital Twin · Simulated equipment · No physical hardware connected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-command-800 hover:bg-command-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition"
            title="Close console"
          >
            ✕
          </button>
        </div>

        {/* Modal Body with Digital Twin */}
        <div className="p-5 overflow-y-auto space-y-4 bg-command-950">
          <PS04DigitalTwin
            softStart={plan?.soft_start_rig}
            thermalPrecool={plan?.thermal_precool_rig}
            telemetry={telemetry}
            twinState={twinState}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-command-900 border-t border-command-800 flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Digital Twin / Simulated Microgrid · Visakhapatnam Coastal Aquaculture Facility</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-petrol-600 hover:bg-petrol-500 text-white font-semibold text-xs rounded-lg transition"
          >
            Back to Workflow
          </button>
        </div>
      </div>
    </div>
  );
};
