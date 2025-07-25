import { PLUGIN } from "@common/networkSides";
import { UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { NetworkError } from "monorepo-networker";
import { useState } from "react";

import "@ui/styles/main.scss";

function App() {
  const [gcode, setGcode] = useState("");
  const [feedRate, setFeedRate] = useState(1000); // Default feed rate in mm/min
  const [rapidFeedRate, setRapidFeedRate] = useState(3000); // Default rapid feed rate in mm/min
  const [laserPower, setLaserPower] = useState(1000); // Default laser power (S parameter)
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const saveToFile = () => {
    if (!gcode.trim()) {
      setError("No G-code to save. Please generate G-code first.");
      return;
    }

    try {
      setError(""); // Clear any previous errors
      // Create a blob with the G-code content
      const blob = new Blob([gcode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

      // Try to extract a meaningful name from the G-code comments
      let baseName = "figma_gcode";
      const gcodeLines = gcode.split('\n');
      for (const line of gcodeLines) {
        if (line.includes('; RECTANGLE') || line.includes('; ELLIPSE') ||
          line.includes('; POLYGON') || line.includes('; STAR') ||
          line.includes('; LINE') || line.includes('; VECTOR')) {
          const shapeType = line.replace(';', '').trim().toLowerCase();
          baseName = `figma_${shapeType}`;
          break;
        }
      }

      a.download = `${baseName}_${timestamp}.nc`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError("Failed to save file. Please try again.");
    }
  };

  return (
    <div className="homepage">
      <h2>G-code generation</h2>
      {/* Selection hint */}
      <div className="notification-place">

        {!error && (
          <div className="info-card notification-card">
            <strong>💡 Before generating G-code:</strong>
            <br />
            Select one or more objects in Figma:
            <br />
            <strong>• Vector shapes:</strong> rectangles, ellipses, polygons, stars, lines, vector paths (traced precisely)
            <br />
            <strong>• Containers:</strong> frames, groups, sections (processes all children)
            <br />
            <strong>• Other objects:</strong> boolean operations, instances, slices, text (generates outline rectangles)
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="error-card notification-card fade-in">
            <strong>❌ Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="card">
        {/* Parameters Section */}
        <div className="parameters-section">
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
            Laser Parameters
          </h3>

          <div className="parameter-row">
            <label htmlFor="laserPower" className="parameter-label">
              Laser Power (0-1000):
            </label>
            <input
              id="laserPower"
              type="number"
              value={laserPower}
              onChange={(e) => {
                setLaserPower(Number(e.target.value));
                if (error) setError(""); // Clear error when user modifies input
              }}
              min="0"
              max="1000"
              className="parameter-input"
            />
          </div>

          <div className="parameter-row">
            <label htmlFor="feedRate" className="parameter-label">
              Feed Rate (mm/min):
            </label>
            <input
              id="feedRate"
              type="number"
              value={feedRate}
              onChange={(e) => {
                setFeedRate(Number(e.target.value));
                if (error) setError(""); // Clear error when user modifies input
              }}
              min="1"
              max="10000"
              className="parameter-input"
            />
          </div>

          <div className="parameter-row">
            <label htmlFor="rapidFeedRate" className="parameter-label">
              Rapid Rate (mm/min):
            </label>
            <input
              id="rapidFeedRate"
              type="number"
              value={rapidFeedRate}
              onChange={(e) => {
                setRapidFeedRate(Number(e.target.value));
                if (error) setError(""); // Clear error when user modifies input
              }}
              min="1"
              max="20000"
              className="parameter-input"
            />
          </div>
        </div>
        <div className="action-buttons">
          <Button
            onClick={async () => {
              setError(""); // Clear previous errors

              // Validate inputs before making the request
              if (feedRate <= 0 || rapidFeedRate <= 0 || laserPower < 0) {
                setError("Invalid parameters: Feed rates must be positive and laser power must be non-negative.");
                return;
              }

              if (feedRate > 10000 || rapidFeedRate > 20000 || laserPower > 1000) {
                setError("Parameters exceed maximum values. Please check the input limits.");
                return;
              }

              setIsGenerating(true);
              try {
                const result = await UI_CHANNEL.request(
                  PLUGIN,
                  "generateGcode",
                  [feedRate, rapidFeedRate, laserPower]
                );
                if (typeof result === "string") {
                  setGcode(result);
                }
              } catch (err) {
                if (err instanceof NetworkError) {
                  setError(err.message || "Failed to generate G-code. Please check your selection and try again.");
                  console.log("Couldn't generate gcode..", {
                    message: err.message,
                  });
                } else {
                  setError("An unexpected error occurred while generating G-code.");
                  console.error("Unexpected error:", err);
                }
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            className="generate-button"
          >
            {isGenerating ? "Generating..." : "Generate G-code"}
          </Button>

          {gcode && (
            <>
              <Button
                onClick={() => {
                  setGcode("");
                  setError("");
                  setSaveSuccess(false);
                  setFeedRate(1000);
                  setRapidFeedRate(3000);
                  setLaserPower(1000);
                }}
                className="clear-button"
              >
                Clear
              </Button>

              <Button
                onClick={saveToFile}
                className={`save-button ${saveSuccess ? 'success' : ''}`}
              >
                Save to File (.nc)
              </Button>
            </>
          )}
        </div>

        <textarea
          id="gcodeOutput"
          value={gcode}
          readOnly
          placeholder="Generated G-code will appear here..."
          className="gcode-textarea"
        />
      </div>
    </div>
  );
}

export default App;
