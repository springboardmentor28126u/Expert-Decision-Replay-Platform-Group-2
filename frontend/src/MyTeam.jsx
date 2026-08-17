import { useEffect, useState } from "react";
import axios from "axios";

function MyTeam({ token, profile }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTeam = async () => {
      try {
        setLoading(true);
        setError("");

        // Get all teams
        const response = await axios.get(
          "http://127.0.0.1:8000/teams",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const teams = response.data || [];

        // Find the team where the current user is the manager.
        // For regular members, the backend currently exposes team_id
        // through the profile response.
        let myTeam = null;

        if (profile?.team_id) {
          const teamResponse = await axios.get(
            `http://127.0.0.1:8000/teams/${profile.team_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          myTeam = teamResponse.data;
        } else {
          myTeam = teams.find(
            (item) => item.manager_id === profile?.id
          );

          if (myTeam) {
            const detailResponse = await axios.get(
              `http://127.0.0.1:8000/teams/${myTeam.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            myTeam = detailResponse.data;
          }
        }

        setTeam(myTeam);
      } catch (err) {
        console.error("Failed to load team", err);
        setError("Unable to load your team information.");
      } finally {
        setLoading(false);
      }
    };

    if (token && profile) {
      fetchMyTeam();
    }
  }, [token, profile]);

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading team...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "24px", color: "var(--danger)" }}>
        {error}
      </div>
    );
  }

  if (!team) {
    return (
      <div className="panel" style={{ padding: "24px" }}>
        <h2>My Team</h2>
        <p style={{ color: "var(--text-muted)" }}>
          You are not currently assigned to a team.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="panel" style={{ padding: "24px" }}>
        <p className="panel-title">My Team</p>

        <h2 style={{ marginTop: "8px" }}>{team.name}</h2>

        <p style={{ color: "var(--text-muted)" }}>
          {team.description || "No description provided."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          <div>
            <strong>Team ID</strong>
            <p>{team.id}</p>
          </div>

          <div>
            <strong>Manager ID</strong>
            <p>{team.manager_id ?? "Not assigned"}</p>
          </div>

          <div>
            <strong>Members</strong>
            <p>{team.member_count ?? 0}</p>
          </div>

          <div>
            <strong>Your User ID</strong>
            <p>{profile?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyTeam;

