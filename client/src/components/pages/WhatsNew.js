import React from "react";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import { CHANGELOG } from "../../changelog.js";

const fmt = (d) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

// Public release notes. Content lives in client/src/changelog.js.
export default function WhatsNew() {
  return (
    <div style={{ height: "100%", width: "100%", overflow: "auto", padding: "24px" }}>
      <Box style={{ maxWidth: 720, margin: "0 auto" }}>
        <Typography component={"div"} variant="h4" color="textPrimary" gutterBottom>
          {"What's new"}
        </Typography>
        <Typography component={"div"} color="textSecondary" style={{ marginBottom: 20 }}>
          {"Recent changes to Partyy, newest first."}
        </Typography>
        {CHANGELOG.map((r) => (
          <Paper key={r.date + r.title} style={{ padding: "16px 20px", marginBottom: 14 }}>
            <Typography component={"div"} variant="caption" color="textSecondary" style={{ letterSpacing: ".06em", textTransform: "uppercase" }}>
              {fmt(r.date)}
            </Typography>
            <Typography component={"div"} variant="h6" color="primary" gutterBottom>
              {r.title}
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.55 }}>
              {r.items.map((it, i) => (
                <li key={i}>
                  <Typography component={"span"} color="textPrimary">{it}</Typography>
                </li>
              ))}
            </ul>
          </Paper>
        ))}
      </Box>
    </div>
  );
}
