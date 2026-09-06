import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../api";
import "./AdminPage.css";

const emptyForm = {
  title: "",
  source: "",
  amount: "",
  course: "",
  gpa: "",
  location: "",
  deadline: "",
  applicationLink: "",
};

const toPayload = (form) => ({
  title: form.title,
  source: form.source,
  amount: form.amount,
  deadline: form.deadline,
  applicationLink: form.applicationLink,
  eligibility: {
    course: form.course || undefined,
    gpa: form.gpa ? Number(form.gpa) : undefined,
    location: form.location || undefined,
  },
});

const toForm = (scholarship) => ({
  title: scholarship.title || "",
  source: scholarship.source || "",
  amount: scholarship.amount || "",
  course: scholarship.eligibility?.course || "",
  gpa: scholarship.eligibility?.gpa ?? "",
  location: scholarship.eligibility?.location || "",
  deadline: scholarship.deadline || "",
  applicationLink: scholarship.applicationLink || "",
});

const AdminPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadScholarships = () => {
    fetch(`${API_BASE_URL}/api/scholarships`)
      .then((res) => res.json())
      .then((data) => setScholarships(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load scholarships."))
      .finally(() => setLoading(false));
  };

  useEffect(loadScholarships, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const path = editingId ? `/api/scholarships/${editingId}` : "/api/scholarships";
    const method = editingId ? "PUT" : "POST";

    const res = await authFetch(path, { method, body: JSON.stringify(toPayload(form)) });
    if (res.status === 401 || res.status === 403) {
      setError("You don't have admin access for this action.");
      return;
    }
    if (!res.ok) {
      setError("Couldn't save that scholarship — check the fields and try again.");
      return;
    }
    resetForm();
    loadScholarships();
  };

  const handleEdit = (scholarship) => {
    setForm(toForm(scholarship));
    setEditingId(scholarship._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this scholarship?")) return;
    const res = await authFetch(`/api/scholarships/${id}`, { method: "DELETE" });
    if (res.status === 401 || res.status === 403) {
      setError("You don't have admin access for this action.");
      return;
    }
    loadScholarships();
  };

  return (
    <div className="admin-page">
      <h1>Manage Scholarships</h1>
      <p className="admin-subtext">
        Scraped data can be messy — review, fix, or remove listings before students see them.
      </p>

      {error && <p className="admin-error">{error}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit scholarship" : "Add a scholarship"}</h2>
        <div className="admin-form-grid">
          <input placeholder="Title" value={form.title} onChange={handleChange("title")} required />
          <input placeholder="Source" value={form.source} onChange={handleChange("source")} required />
          <input placeholder="Amount (e.g. $500)" value={form.amount} onChange={handleChange("amount")} required />
          <input placeholder="Deadline (e.g. 2026-05-01)" value={form.deadline} onChange={handleChange("deadline")} required />
          <input placeholder="Course/major requirement" value={form.course} onChange={handleChange("course")} />
          <input placeholder="Min GPA" type="number" step="0.01" value={form.gpa} onChange={handleChange("gpa")} />
          <input placeholder="Location requirement" value={form.location} onChange={handleChange("location")} />
          <input
            placeholder="Application link"
            value={form.applicationLink}
            onChange={handleChange("applicationLink")}
            required
          />
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="pill-btn pill-btn--filled">
            {editingId ? "Save changes" : "Add scholarship"}
          </button>
          {editingId && (
            <button type="button" className="pill-btn pill-btn--outline" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="admin-list-heading">All scholarships ({scholarships.length})</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scholarships.map((s) => (
                <tr key={s._id}>
                  <td>{s.title}</td>
                  <td>{s.source}</td>
                  <td>{s.amount}</td>
                  <td>{s.deadline}</td>
                  <td className="admin-row-actions">
                    <button type="button" onClick={() => handleEdit(s)}>
                      Edit
                    </button>
                    <button type="button" className="admin-delete-btn" onClick={() => handleDelete(s._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
