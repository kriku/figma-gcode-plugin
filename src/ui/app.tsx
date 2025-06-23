import { PLUGIN } from "@common/networkSides";
import { UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { NetworkError } from "monorepo-networker";
import { useState } from "react";

import "@ui/styles/main.scss";

function App() {
  const [gcode, setGcode] = useState("");
  const [feedRate, setFeedRate] = useState(1000); // Default feed rate in mm/min
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveToFile = () => {
    if (!gcode.trim()) {
      return;
    }

    try {
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
    }
  };

  return (
    <div className="homepage">
      <h1>Figma to G-code</h1>

      <div className="card">
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="feedRate" style={{ display: "block", marginBottom: 5 }}>
            Laser Feed Rate (mm/min):
          </label>
          <input
            id="feedRate"
            type="number"
            value={feedRate}
            onChange={(e) => setFeedRate(Number(e.target.value))}
            min="1"
            max="10000"
            style={{
              width: "100%",
              padding: "5px 10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>
        <Button
          onClick={async () => {
            try {
              const result = await UI_CHANNEL.request(
                PLUGIN,
                "generateGcode",
                [feedRate]
              );
              if (typeof result === "string") {
                setGcode(result);
              }
            } catch (err) {
              if (err instanceof NetworkError) {
                console.log("Couldn't generate gcode..", {
                  message: err.message,
                });
              }
            }
          }}
        >
          Generate G-code
        </Button>

        {gcode && (
          <Button
            onClick={saveToFile}
            style={{
              backgroundColor: saveSuccess ? '#4CAF50' : '#28a745',
              color: 'white'
            }}
          >
            Save to File (.nc)
          </Button>
        )}

        <textarea
          id="gcodeOutput"
          value={gcode}
          readOnly
          placeholder="Generated G-code will appear here..."
          style={{
            width: "100%",
            height: 300,
            marginTop: gcode ? 0 : 10,
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>
    </div>
  );
}

export default App;
