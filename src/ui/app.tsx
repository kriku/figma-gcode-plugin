import { PLUGIN } from "@common/networkSides";
import { UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { NetworkError } from "monorepo-networker";
import { useState } from "react";

import "@ui/styles/main.scss";

function App() {
  const [gcode, setGcode] = useState("");
  const [feedRate, setFeedRate] = useState(1000); // Default feed rate in mm/min

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
        <textarea
          value={gcode}
          readOnly
          style={{ width: "100%", height: 300, marginTop: 10 }}
        />
      </div>
    </div>
  );
}

export default App;
