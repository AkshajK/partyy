import React, { Component } from "react";
import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import { post } from "../../utilities.js";

// Admin page (site admins only): import songs into a category and see what's there.
// Paste a Spotify playlist link, a YouTube playlist link, or one song per line
// ("Title - Artist", "Title, Artist", "Title by Artist").
class CategoryDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      categoryName: "",
      input: "",
      jobs: [],
      submitting: false,
      message: "",
    };
  }

  componentDidMount() {
    this.refresh();
    this.poll = setInterval(() => this.refreshJobs(), 4000);
  }

  componentWillUnmount() {
    clearInterval(this.poll);
  }

  refresh = () => {
    post("api/getCategoryAndSongData", {}).then((data) => this.setState({ data: data }));
    this.refreshJobs();
  };

  refreshJobs = () => {
    post("api/importJobs", {}).then((jobs) => {
      const wasRunning = this.state.jobs.some((j) => j.status === "running" || j.status === "queued");
      const running = jobs.some((j) => j.status === "running" || j.status === "queued");
      this.setState({ jobs: jobs });
      if (wasRunning && !running) post("api/getCategoryAndSongData", {}).then((data) => this.setState({ data: data }));
    });
  };

  submit = () => {
    if (!this.state.input.trim()) return;
    this.setState({ submitting: true, message: "" });
    post("api/importSongs", { categoryName: this.state.categoryName, input: this.state.input })
      .then((r) => {
        this.setState({
          submitting: false,
          input: "",
          message: r.mode === "remote" ? "Queued. Downloads run on the ingest worker; watch progress below." : "Started. Watch progress below.",
        });
        this.refreshJobs();
      })
      .catch((e) => this.setState({ submitting: false, message: "Failed: " + e }));
  };

  render() {
    if (!this.state.data) return <h1>Loading</h1>;
    const selected = this.props.category;

    return (
      <div style={{ height: "100%", width: "100%", overflow: "auto", padding: "20px" }}>
        <Typography component={"div"} variant="h3" color="textPrimary" gutterBottom>
          {"Songs"}
        </Typography>

        <Typography component={"div"} variant="h5" color="primary" gutterBottom>
          {"Import"}
        </Typography>
        <TextField
          label="Category name (blank = use the playlist's name)"
          variant="outlined"
          fullWidth
          margin="dense"
          value={this.state.categoryName}
          onChange={(e) => this.setState({ categoryName: e.target.value })}
        />
        <TextField
          label="Spotify playlist link, YouTube playlist link, or one song per line (Title - Artist)"
          variant="outlined"
          fullWidth
          multiline
          rows={5}
          margin="dense"
          value={this.state.input}
          onChange={(e) => this.setState({ input: e.target.value })}
        />
        <Box style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
          <Button variant="contained" color="primary" onClick={this.submit} disabled={this.state.submitting || !this.state.input.trim()}>
            Import
          </Button>
          <Typography component={"div"} color="textSecondary">
            {this.state.message}
          </Typography>
        </Box>

        {this.state.jobs.length > 0 && (
          <Box style={{ marginTop: "16px" }}>
            <Typography component={"div"} variant="h5" color="primary" gutterBottom>
              {"Recent imports"}
            </Typography>
            {this.state.jobs.map((j) => (
              <Box key={j._id} style={{ marginBottom: "12px", padding: "10px", border: "1px solid #333", borderRadius: "6px" }}>
                <Typography component={"div"} color="textPrimary">
                  <b>{j.categoryName || "(playlist name)"}</b>
                  {"  " + j.status + "  " + j.done + " added"}
                  {j.skipped ? ", " + j.skipped + " already there" : ""}
                  {j.failed.length ? ", " + j.failed.length + " failed" : ""}
                  {j.total ? " of " + j.total : ""}
                  {j.error ? "  error: " + j.error : ""}
                </Typography>
                <Typography component={"div"} variant="caption" color="textSecondary" style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {j.log.join("\n")}
                </Typography>
                {j.failed.length > 0 && (
                  <Typography component={"div"} variant="caption" color="error" style={{ whiteSpace: "pre-wrap" }}>
                    {j.failed.map((f) => f.title + " - " + f.artist + ": " + f.reason).join("\n")}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Grid container direction="row" style={{ width: "100%", marginTop: "16px" }}>
          <Box width={1 / 2} style={{ overflow: "auto" }}>
            <Typography component={"div"} variant="h5" color="primary" gutterBottom>
              {"Categories"}
            </Typography>
            {this.state.data.map((entry) => (
              <Typography key={entry.category._id} component={"div"} variant="h6" color={selected && selected._id === entry.category._id ? "secondary" : "textPrimary"}>
                {entry.category.name + " (" + entry.songs.length + ")"}
              </Typography>
            ))}
          </Box>
          <Box width={1 / 2} style={{ overflow: "auto" }}>
            <Typography component={"div"} variant="h5" color="primary" gutterBottom>
              {selected ? selected.name : "Pick a category in the sidebar"}
            </Typography>
            {selected && (
              <Button
                onDoubleClick={() => {
                  post("api/deleteCategory", { categoryId: selected._id }).then(() => window.location.reload());
                }}
                fullWidth
              >
                {"Double click to delete " + selected.name}
              </Button>
            )}
            {this.state.data
              .filter((e) => selected && e.category._id + "" === selected._id + "")
              .map((entry) =>
                entry.songs.map((song) => (
                  <Typography key={song._id} component={"div"} color={song.audioFile ? "textPrimary" : "textSecondary"}>
                    {song.title + " by " + song.artist[0] + (song.audioFile ? "" : "  (old 30s preview)")}
                  </Typography>
                ))
              )}
          </Box>
        </Grid>
      </div>
    );
  }
}

export default CategoryDashboard;
