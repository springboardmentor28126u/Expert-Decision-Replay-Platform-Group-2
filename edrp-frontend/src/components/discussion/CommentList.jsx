function CommentList() {

    const comments = [
        {
            id: 1,
            user: "Raj",
            message: "AWS is the best option for scalability.",
            date: "15 Jul 2026"
        },
        {
            id: 2,
            user: "Anjali",
            message: "Azure should also be evaluated.",
            date: "16 Jul 2026"
        }
    ];

    return (

        <div>

            <div className="section-header">

                <h2>Comments</h2>

                <button className="approve-btn">
                    + Add Comment
                </button>

            </div>

            <div className="profile-card">

                {comments.map((comment) => (

                    <div
                        key={comment.id}
                        className="discussion-item"
                    >

                        <h4>{comment.user}</h4>

                        <p>{comment.message}</p>

                        <small>{comment.date}</small>

                        <hr />

                    </div>

                ))}

            </div>

        </div>

    );

}

export default CommentList;