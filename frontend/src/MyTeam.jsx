import { useEffect, useState } from "react";
import axios from "axios";
import { Users } from "lucide-react";

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

        // Find the team where the current user is the manager or member.
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
        <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
          You are not currently assigned to a team.
        </p>
      </div>
    );
  }

  const isManagerMe = team.manager_id === profile?.id;
  const managerName = team.manager 
    ? `${team.manager.full_name}${isManagerMe ? " (you)" : ""}`
    : "Not assigned";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>My Team</h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Teams you manage, and who's on them
        </p>
      </div>

      <div style={{
        background: "#171A21", border: "1px solid #262B36", borderRadius: "8px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{team.name}</h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Manager: <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{managerName}</span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "14px", borderTop: "1px solid #262B36", paddingTop: "12px" }}>
          <Users size={16} />
          <span>{team.member_count ?? 0} {team.member_count === 1 ? "member" : "members"}</span>
        </div>

        {team.members && team.members.length > 0 && (
          <div style={{
            background: "#12161D", border: "1px solid #2E3646", borderRadius: "6px", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>
            {team.members.map((m) => {
              const isMe = m.id === profile?.id;
              return (
                <div key={m.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "13px" }}>
                      {m.full_name}{isMe ? " (you)" : ""}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{m.email}</div>
                  </div>
                  <span style={{
                    padding: "4px 10px", background: "#1F242F", border: "1px solid #2E3646",
                    borderRadius: "12px", fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)",
                    textTransform: "capitalize"
                  }}>
                    {m.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTeam;
