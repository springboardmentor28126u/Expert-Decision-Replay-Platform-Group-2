function MeetingNoteList() {

    const meetingNotes = [
        {
            id: 1,
            title: "Kick-off Meeting",
            note: "Discussed AWS migration strategy and estimated timeline.",
            createdBy: "Raj",
            createdDate: "15 Jul 2026"
        },
        {
            id: 2,
            title: "Review Meeting",
            note: "Compared AWS and Azure costs before final decision.",
            createdBy: "Anjali",
            createdDate: "16 Jul 2026"
        }
    ];

    return (

        <div>

            <div className="section-header">

                <h2>Meeting Notes</h2>

                <button className="approve-btn">
                    + Add Meeting Note
                </button>

            </div>

            <div className="profile-card">

                {meetingNotes.map((note) => (

                    <div
                        key={note.id}
                        className="discussion-item"
                    >

                        <h4>{note.title}</h4>

                        <p>{note.note}</p>

                        <p>
                            <strong>Created By:</strong> {note.createdBy}
                        </p>

                        <small>{note.createdDate}</small>

                        <hr />

                    </div>

                ))}

            </div>

        </div>

    );

}

export default MeetingNoteList;