import React, { Component } from "react";
import "../../utilities.css";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";
import ReplayIcon from "@material-ui/icons/Replay";
import { notification } from "antd";
import { post } from "../../utilities.js";

// Admin library: every song, sortable and filterable, with actions.
// Site admins only (isSiteAdmin on the user row).

const VARIANT = /\b(remix|remixes|dub|live|acoustic|instrumental|karaoke|cover|edit|version|mix|sped up|slowed|demo|remaster(?:ed)?|radio|extended|tribute|medley|nightcore|club)\b/i;

const fmt = (s) => (s ? Math.floor(s / 60) + ":" + String(Math.round(s) % 60).padStart(2, "0") : "");

// Why a row might be the wrong recording: variant word the import never asked for,
// or a title that drifted far from what was requested.
function flagsFor(song) {
  const f = [];
  const req = song.requested && song.requested.title;
  if (VARIANT.test(song.title) && !(req && VARIANT.test(req))) f.push("variant in title");
  if (req) {
    const w = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((x) => x.length > 1));
    const a = w(req), b = w(song.title);
    const hit = [...a].filter((x) => b.has(x)).length;
    if (a.size && hit / a.size < 0.5) f.push("title unlike request: " + req);
  }
  if (song.duration && song.duration > 480) f.push("over 8 minutes");
  if (song.legacy) f.push("old 30s preview");
  return f;
}

class Library extends Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
      categories: [],
      jobs: [],
      q: "",
      cat: "",
      len: "",
      onlyFlagged: false,
      sortK: "title",
      sortDir: 1,
      // import panel
      importName: "",
      importInput: "",
      importing: false,
      importMsg: "",
      // dialogs
      edit: null, // song being edited {id,title,artist,categoryId,releaseYear}
      refetch: null, // {song, url}
      renameCat: null, // {id,name}
      loaded: false,
      forbidden: false,
    };
  }

  componentDidMount() {
    this.load();
    this.poll = setInterval(() => this.loadJobs(true), 5000);
  }
  componentWillUnmount() {
    clearInterval(this.poll);
  }

  load = () => {
    post("api/library", {})
      .then((d) => this.setState({ songs: d.songs, categories: d.categories, loaded: true }))
      .catch(() => this.setState({ forbidden: true, loaded: true }));
    this.loadJobs(false);
  };

  loadJobs = (reloadIfSettled) => {
    post("api/importJobs", {})
      .then((jobs) => {
        const wasBusy = this.state.jobs.some((j) => j.status === "running" || j.status === "queued");
        const busy = jobs.some((j) => j.status === "running" || j.status === "queued");
        this.setState({ jobs });
        if (reloadIfSettled && wasBusy && !busy) post("api/library", {}).then((d) => this.setState({ songs: d.songs, categories: d.categories }));
      })
      .catch(() => {});
  };

  toast = (message) => notification.success({ message, duration: 2 });

  // ---- actions
  submitImport = () => {
    if (!this.state.importInput.trim()) return;
    this.setState({ importing: true, importMsg: "" });
    post("api/importSongs", { categoryName: this.state.importName, input: this.state.importInput })
      .then((r) => {
        this.setState({ importing: false, importInput: "", importMsg: r.mode === "remote" ? "Queued for the ingest worker." : "Started." });
        this.loadJobs(false);
      })
      .catch((e) => this.setState({ importing: false, importMsg: "Failed: " + e }));
  };

  saveEdit = () => {
    const e = this.state.edit;
    post("api/library/updateSong", {
      id: e.id,
      title: e.title,
      artist: e.artist.split(",").map((a) => a.trim()).filter(Boolean),
      categoryId: e.categoryId,
      releaseYear: e.releaseYear ? parseInt(e.releaseYear, 10) : undefined,
    }).then(() => {
      this.setState({ edit: null });
      this.toast("Saved");
      this.load();
    });
  };

  deleteSong = (s) => {
    if (!window.confirm(`Delete "${s.title}" by ${s.artist[0] || "?"}? This removes the audio too.`)) return;
    post("api/library/deleteSong", { id: s._id }).then(() => {
      this.setState({ songs: this.state.songs.filter((x) => x._id !== s._id) });
      this.toast("Deleted");
    });
  };

  submitRefetch = () => {
    const r = this.state.refetch;
    post("api/library/refetchSong", { id: r.song._id, youtube: r.url })
      .then(() => {
        this.setState({ refetch: null });
        this.toast("Re-fetch queued");
        this.loadJobs(false);
      })
      .catch((e) => notification.error({ message: "Could not queue: " + e }));
  };

  makeDefault = (c) => {
    post("api/library/updateCategory", { id: c._id, makeDefault: true }).then(() => {
      this.toast(c.name + " is now the default mode");
      this.load();
    });
  };

  saveRename = () => {
    const r = this.state.renameCat;
    post("api/library/updateCategory", { id: r.id, name: r.name }).then(() => {
      this.setState({ renameCat: null });
      this.toast("Renamed");
      this.load();
    });
  };

  deleteCategory = (c) => {
    const n = this.state.songs.filter((s) => s.categoryId === c._id + "").length;
    if (!window.confirm(`Delete category "${c.name}" and its ${n} songs?`)) return;
    post("api/deleteCategory", { categoryId: c._id }).then(() => {
      this.toast("Category deleted");
      this.load();
    });
  };

  sortBy = (k) => {
    if (this.state.sortK === k) this.setState({ sortDir: -this.state.sortDir });
    else this.setState({ sortK: k, sortDir: k === "duration" || k === "added" || k === "releaseYear" ? -1 : 1 });
  };

  // ---- derived
  visibleSongs() {
    const { songs, q, cat, len, onlyFlagged, sortK, sortDir } = this.state;
    const ql = q.trim().toLowerCase();
    let rows = songs.filter((s) => {
      if (cat && s.categoryId !== cat) return false;
      if (ql && !(s.title + " " + s.artist.join(" ") + " " + ((s.requested && s.requested.title) || "")).toLowerCase().includes(ql)) return false;
      if (len === "short" && !(s.duration < 180)) return false;
      if (len === "mid" && !(s.duration >= 180 && s.duration <= 270)) return false;
      if (len === "long" && !(s.duration > 270)) return false;
      if (onlyFlagged && flagsFor(s).length === 0) return false;
      return true;
    });
    const catName = Object.fromEntries(this.state.categories.map((c) => [c._id + "", c.name]));
    const key = (s) => {
      if (sortK === "artist") return (s.artist[0] || "").toLowerCase();
      if (sortK === "category") return catName[s.categoryId] || "";
      if (sortK === "added") return new Date(s.added).getTime();
      if (sortK === "releaseYear" || sortK === "duration") return s[sortK] || 0;
      return (s[sortK] || "").toLowerCase();
    };
    rows.sort((a, b) => {
      const x = key(a), y = key(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir || a.title.localeCompare(b.title);
    });
    return rows;
  }

  render() {
    const { categories, songs, jobs, loaded, forbidden } = this.state;
    if (!loaded) return <Typography style={{ padding: 20 }}>Loading</Typography>;
    if (forbidden) return <Typography style={{ padding: 20 }}>Admins only. Ask Kevin to flag your user.</Typography>;
    const catName = Object.fromEntries(categories.map((c) => [c._id + "", c.name]));
    const rows = this.visibleSongs();
    const busyJobs = jobs.filter((j) => j.status === "running" || j.status === "queued");
    const flaggedCount = songs.filter((s) => flagsFor(s).length).length;
    const withYear = songs.filter((s) => s.releaseYear);
    const head = (k, label, align) => (
      <TableCell align={align} sortDirection={this.state.sortK === k ? (this.state.sortDir > 0 ? "asc" : "desc") : false}>
        <TableSortLabel active={this.state.sortK === k} direction={this.state.sortK === k && this.state.sortDir < 0 ? "desc" : "asc"} onClick={() => this.sortBy(k)}>
          {label}
        </TableSortLabel>
      </TableCell>
    );

    return (
      <div style={{ height: "100%", width: "100%", overflow: "auto", padding: "20px" }}>
        <Typography component={"div"} variant="h4" color="textPrimary" gutterBottom>
          {"Library"}
          <Typography component={"span"} color="textSecondary" style={{ marginLeft: 14, fontSize: 16 }}>
            {songs.length + " songs"}
            {withYear.length ? " · " + Math.min(...withYear.map((s) => s.releaseYear)) + "–" + Math.max(...withYear.map((s) => s.releaseYear)) : ""}
            {flaggedCount ? " · " + flaggedCount + " flagged" : ""}
          </Typography>
        </Typography>

        {/* categories */}
        <Box style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <Chip label={"All (" + songs.length + ")"} color={this.state.cat === "" ? "primary" : "default"} onClick={() => this.setState({ cat: "" })} />
          {categories.map((c) => {
            const n = songs.filter((s) => s.categoryId === c._id + "").length;
            return (
              <Chip
                key={c._id}
                label={c.name + " (" + n + ")" + (c.isDefault ? " · default" : "")}
                color={this.state.cat === c._id + "" ? "primary" : "default"}
                onClick={() => this.setState({ cat: c._id + "" })}
              />
            );
          })}
          {this.state.cat && (
            <React.Fragment>
              <Button size="small" onClick={() => this.setState({ renameCat: { id: this.state.cat, name: catName[this.state.cat] } })}>Rename</Button>
              <Button size="small" disabled={(categories.find((c) => c._id + "" === this.state.cat) || {}).isDefault} onClick={() => this.makeDefault(categories.find((c) => c._id + "" === this.state.cat))}>
                Make default
              </Button>
              <Button size="small" color="secondary" onClick={() => this.deleteCategory(categories.find((c) => c._id + "" === this.state.cat))}>Delete category</Button>
            </React.Fragment>
          )}
        </Box>

        {/* import panel */}
        <Paper style={{ padding: 14, marginBottom: 14 }}>
          <Typography component={"div"} variant="subtitle1" color="primary" gutterBottom>
            {"Import songs"}
          </Typography>
          <Box style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            <TextField
              label="Category (new or existing; blank = playlist name)"
              variant="outlined"
              size="small"
              style={{ minWidth: 320 }}
              value={this.state.importName}
              onChange={(e) => this.setState({ importName: e.target.value })}
            />
            <TextField
              label="Spotify playlist link, YouTube playlist link, or one song per line (Title - Artist)"
              variant="outlined"
              size="small"
              multiline
              rows={3}
              style={{ flex: "1 1 420px" }}
              value={this.state.importInput}
              onChange={(e) => this.setState({ importInput: e.target.value })}
            />
            <Button variant="contained" color="primary" onClick={this.submitImport} disabled={this.state.importing || !this.state.importInput.trim()}>
              Import
            </Button>
          </Box>
          <Typography component={"div"} variant="caption" color="textSecondary" style={{ marginTop: 6 }}>
            {this.state.importMsg}
            {busyJobs.length ? " Running: " + busyJobs.map((j) => (j.categoryName || "(playlist)") + " " + j.done + "/" + (j.total || "?")).join(", ") : ""}
            {!busyJobs.length && jobs[0] ? " Last: " + (jobs[0].categoryName || "(playlist)") + " " + jobs[0].status + ", " + jobs[0].done + " added" + (jobs[0].failed.length ? ", " + jobs[0].failed.length + " failed" : "") : ""}
          </Typography>
          {jobs[0] && (jobs[0].failed.length > 0 || busyJobs.length > 0) && (
            <Typography component={"div"} variant="caption" color="textSecondary" style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", marginTop: 4 }}>
              {(busyJobs[0] || jobs[0]).log.slice(-4).join("\n")}
              {jobs[0].failed.length ? "\n" + jobs[0].failed.map((f) => "failed: " + f.title + " - " + f.artist + " (" + f.reason + ")").join("\n") : ""}
            </Typography>
          )}
        </Paper>

        {/* filters */}
        <Box style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <TextField label="Search title or artist" variant="outlined" size="small" style={{ minWidth: 280 }} value={this.state.q} onChange={(e) => this.setState({ q: e.target.value })} />
          <Select variant="outlined" value={this.state.len} onChange={(e) => this.setState({ len: e.target.value })} displayEmpty style={{ height: 40 }}>
            <MenuItem value="">Any length</MenuItem>
            <MenuItem value="short">Under 3:00</MenuItem>
            <MenuItem value="mid">3:00 to 4:30</MenuItem>
            <MenuItem value="long">Over 4:30</MenuItem>
          </Select>
          <Chip label={"Flagged only" + (flaggedCount ? " (" + flaggedCount + ")" : "")} color={this.state.onlyFlagged ? "secondary" : "default"} onClick={() => this.setState({ onlyFlagged: !this.state.onlyFlagged })} />
          <Typography component={"div"} color="textSecondary" style={{ marginLeft: "auto" }}>
            {rows.length + " shown"}
          </Typography>
        </Box>

        {/* table */}
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell />
                {head("title", "Title")}
                {head("artist", "Artist")}
                {head("category", "Category")}
                {head("releaseYear", "Year", "right")}
                {head("duration", "Length", "right")}
                {head("added", "Added", "right")}
                <TableCell>Source</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => {
                const flags = flagsFor(s);
                return (
                  <TableRow key={s._id} hover style={s.pending ? { opacity: 0.5 } : undefined}>
                    <TableCell style={{ width: 44, paddingRight: 0 }}>
                      {s.artUrl ? <img src={s.artUrl.replace("600x600bb", "100x100bb")} alt="" width={32} height={32} style={{ borderRadius: 3, display: "block" }} /> : <div style={{ width: 32, height: 32, borderRadius: 3, background: "#333" }} />}
                    </TableCell>
                    <TableCell>
                      {s.title}
                      {flags.length > 0 && (
                        <Tooltip title={flags.join("; ")}>
                          <span style={{ color: "#e25141", marginLeft: 6, fontSize: 12 }}>{"⚑"}</span>
                        </Tooltip>
                      )}
                      {s.pending && <span style={{ color: "#999", marginLeft: 6, fontSize: 12 }}>syncing</span>}
                    </TableCell>
                    <TableCell>{s.artist.join(", ")}</TableCell>
                    <TableCell style={{ color: "#999" }}>{catName[s.categoryId] || "?"}</TableCell>
                    <TableCell align="right" style={{ fontVariantNumeric: "tabular-nums", color: "#999" }}>{s.releaseYear || ""}</TableCell>
                    <TableCell align="right" style={{ fontVariantNumeric: "tabular-nums", color: "#999" }}>{fmt(s.duration)}</TableCell>
                    <TableCell align="right" style={{ fontVariantNumeric: "tabular-nums", color: "#999", whiteSpace: "nowrap" }}>{String(s.added).slice(0, 10)}</TableCell>
                    <TableCell>
                      {s.youtubeId ? (
                        <a href={"https://www.youtube.com/watch?v=" + s.youtubeId} target="_blank" rel="noopener noreferrer" style={{ color: "#4595EC" }}>YouTube</a>
                      ) : (
                        <span style={{ color: "#999" }}>Spotify preview</span>
                      )}
                    </TableCell>
                    <TableCell align="right" style={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit title, artist, category, year">
                        <IconButton size="small" onClick={() => this.setState({ edit: { id: s._id, title: s.title, artist: s.artist.join(", "), categoryId: s.categoryId, releaseYear: s.releaseYear || "" } })}>
                          <CreateIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Replace audio with a YouTube video you pick">
                        <IconButton size="small" onClick={() => this.setState({ refetch: { song: s, url: "" } })}>
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete song">
                        <IconButton size="small" onClick={() => this.deleteSong(s)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* edit dialog */}
        <Dialog open={!!this.state.edit} onClose={() => this.setState({ edit: null })} fullWidth maxWidth="sm">
          <DialogTitle>Edit song</DialogTitle>
          {this.state.edit && (
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <TextField label="Title" value={this.state.edit.title} onChange={(e) => this.setState({ edit: { ...this.state.edit, title: e.target.value } })} fullWidth />
              <TextField label="Artist (comma-separated)" value={this.state.edit.artist} onChange={(e) => this.setState({ edit: { ...this.state.edit, artist: e.target.value } })} fullWidth />
              <Select value={this.state.edit.categoryId} onChange={(e) => this.setState({ edit: { ...this.state.edit, categoryId: e.target.value } })} fullWidth>
                {categories.map((c) => (
                  <MenuItem key={c._id} value={c._id + ""}>{c.name}</MenuItem>
                ))}
              </Select>
              <TextField label="Release year" value={this.state.edit.releaseYear} onChange={(e) => this.setState({ edit: { ...this.state.edit, releaseYear: e.target.value.replace(/\D/g, "").slice(0, 4) } })} style={{ width: 140 }} />
            </DialogContent>
          )}
          <DialogActions>
            <Button onClick={() => this.setState({ edit: null })}>Cancel</Button>
            <Button color="primary" onClick={this.saveEdit}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* refetch dialog */}
        <Dialog open={!!this.state.refetch} onClose={() => this.setState({ refetch: null })} fullWidth maxWidth="sm">
          <DialogTitle>Replace audio</DialogTitle>
          {this.state.refetch && (
            <DialogContent>
              <Typography color="textSecondary" gutterBottom>
                {this.state.refetch.song.title + " by " + this.state.refetch.song.artist.join(", ") + ". Paste the YouTube link of the recording you want. The ingest worker downloads it and swaps the file."}
              </Typography>
              <TextField label="YouTube link or video id" value={this.state.refetch.url} onChange={(e) => this.setState({ refetch: { ...this.state.refetch, url: e.target.value } })} fullWidth autoFocus />
            </DialogContent>
          )}
          <DialogActions>
            <Button onClick={() => this.setState({ refetch: null })}>Cancel</Button>
            <Button color="primary" onClick={this.submitRefetch} disabled={!this.state.refetch || !this.state.refetch.url.trim()}>Queue re-fetch</Button>
          </DialogActions>
        </Dialog>

        {/* rename category dialog */}
        <Dialog open={!!this.state.renameCat} onClose={() => this.setState({ renameCat: null })}>
          <DialogTitle>Rename category</DialogTitle>
          {this.state.renameCat && (
            <DialogContent>
              <TextField label="Name" value={this.state.renameCat.name} onChange={(e) => this.setState({ renameCat: { ...this.state.renameCat, name: e.target.value } })} autoFocus />
            </DialogContent>
          )}
          <DialogActions>
            <Button onClick={() => this.setState({ renameCat: null })}>Cancel</Button>
            <Button color="primary" onClick={this.saveRename} disabled={!this.state.renameCat || !this.state.renameCat.name.trim()}>Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default Library;
