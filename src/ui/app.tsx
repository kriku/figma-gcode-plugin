import { PLUGIN } from "@common/networkSides";
import { UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { NetworkError } from "monorepo-networker";
import { useState } from "react";

import "@ui/styles/main.scss";

function App() {
  const [gcode, setGcode] = useState("");

  return (
    <div className="homepage">
      <h1>Figma to G-code</h1>

      <div className="card">
        <Button
          onClick={async () => {
            try {
              const result = await UI_CHANNEL.request(
                PLUGIN,
                "generateGcode",
                []
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
