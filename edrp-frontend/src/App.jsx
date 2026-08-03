// import { Routes, Route, Navigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// import api from "./services/api";

// import Login from "./pages/Login";
// import Register from "./pages/Register";

// import Dashboard from "./pages/dashboard/Dashboard";

// import Users from "./pages/admin/Users";
// import Teams from "./pages/admin/Teams";

// // Decision Pages
// import DecisionList from "./pages/decisions/DecisionList";
// import CreateDecision from "./pages/decisions/CreateDecision";
// import EditDecision from "./pages/decisions/EditDecision";
// import DecisionDetails from "./pages/decisions/DecisionDetails";

// import Alternatives from "./pages/decisions/Alternative";
// import Knowledge from "./pages/decisions/Knowledge";
// import VersionHistory from "./pages/decisions/VersionHistory";
// import Attachment from "./pages/decisions/Attachment";

// // Category Pages
// import CategoryList from "./pages/categories/CategoryList";
// import CreateCategory from "./pages/categories/CreateCategory";
// import CategoryDetails from "./pages/categories/CategoryDetails";


// function App() {


//     const [user, setUser] = useState(null);



//     useEffect(() => {


//         const fetchUser = async () => {


//             try {


//                 const token = localStorage.getItem("access_token");


//                 if(token){


//                     const response = await api.get("/users/me");


//                     setUser(response.data);


//                 }


//             }
//             catch(error){


//                 console.log(
//                     "User Fetch Error:",
//                     error
//                 );


//                 localStorage.removeItem("access_token");


//             }


//         };



//         fetchUser();


//     }, []);





//     return (

//         <Routes>


//             {/* Authentication */}

//             <Route 
//                 path="/" 
//                 element={
//                     <Navigate 
//                         to="/login" 
//                         replace 
//                     />
//                 } 
//             />


//             <Route 
//                 path="/login" 
//                 element={<Login />} 
//             />


//             <Route 
//                 path="/register" 
//                 element={<Register />} 
//             />




//             {/* Dashboard */}

//             <Route
//                 path="/dashboard"
//                 element={
//                     user ?
//                     <Dashboard user={user}/>
//                     :
//                     <h2>Loading...</h2>
//                 }
//             />





//             {/* Users & Teams */}

//             <Route
//                 path="/users"
//                 element={
//                     user ?
//                     <Users user={user}/>
//                     :
//                     <h2>Loading...</h2>
//                 }
//             />



//             <Route
//                 path="/teams"
//                 element={
//                     user ?
//                     <Teams user={user}/>
//                     :
//                     <h2>Loading...</h2>
//                 }
//             />





//             {/* Decision Management */}


//             <Route 
//                 path="/decisions" 
//                 element={<DecisionList />} 
//             />


//             <Route 
//                 path="/decisions/create" 
//                 element={<CreateDecision />} 
//             />


//             <Route 
//                 path="/decisions/:id" 
//                 element={<DecisionDetails />} 
//             />


//             <Route 
//                 path="/decisions/:id/edit" 
//                 element={<EditDecision />} 
//             />



//             {/* Decision Sub Pages */}


//             <Route
//                 path="/decisions/:id/alternatives"
//                 element={<Alternatives />}
//             />


//             <Route
//                 path="/decisions/:id/knowledge"
//                 element={<Knowledge />}
//             />


//             <Route
//                 path="/decisions/:id/history"
//                 element={<VersionHistory />}
//             />


//             <Route
//                 path="/decisions/:id/attachments"
//                 element={<Attachment />}
//             />





//             {/* Categories */}


//             <Route
//                 path="/categories"
//                 element={<CategoryList />}
//             />


//             <Route
//                 path="/categories/create"
//                 element={<CreateCategory />}
//             />


//             <Route
//                 path="/categories/:id"
//                 element={<CategoryDetails />}
//             />



//         </Routes>

//     );

// }


// export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import api from "./services/api";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/dashboard/Dashboard";

import Users from "./pages/admin/Users";
import Teams from "./pages/admin/Teams";

// Decision Pages
import DecisionList from "./pages/decisions/DecisionList";
import CreateDecision from "./pages/decisions/CreateDecision";
import EditDecision from "./pages/decisions/EditDecision";
import DecisionDetails from "./pages/decisions/DecisionDetails";

import Alternatives from "./pages/decisions/Alternative";
import Knowledge from "./pages/decisions/Knowledge";
import VersionHistory from "./pages/decisions/VersionHistory";
import Attachment from "./pages/decisions/Attachment";

// Discussion Pages
import DiscussionList from "./pages/discussion/DiscussionList";
import DiscussionDetails from "./pages/discussion/DiscussionDetails";
import CreateDiscussion from "./pages/discussion/CreateDiscussion";

// Category Pages
import CategoryList from "./pages/categories/CategoryList";
import CreateCategory from "./pages/categories/CreateCategory";
import CategoryDetails from "./pages/categories/CategoryDetails";
import AddAlternative from "./pages/decisions/AddAlternative";
import EditAlternative from "./pages/decisions/EditAlternative";
import ViewAlternative from "./pages/decisions/ViewAlternative";
import AssignedDecisions from "./pages/Reviewer/AssignedDecisions";
import MyReviews from "./pages/Reviewer/MyReviews";
function App() {

    const [user, setUser] = useState(null);

    useEffect(() => {

        const fetchUser = async () => {

            try {

                const token = localStorage.getItem("access_token");

                if (token) {

                    const response = await api.get("/users/me");

                    setUser(response.data);

                }

            } catch (error) {

                console.log("User Fetch Error:", error);

                localStorage.removeItem("access_token");

            }

        };

        fetchUser();

    }, []);

    return (

        <Routes>

            {/* Authentication */}

            <Route
                path="/"
                element={<Navigate to="/login" replace />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            {/* Dashboard */}

            <Route
                path="/dashboard"
                element={
                    user
                        ? <Dashboard user={user} />
                        : <h2>Loading...</h2>
                }
            />

            {/* Users */}

            <Route
                path="/users"
                element={
                    user
                        ? <Users user={user} />
                        : <h2>Loading...</h2>
                }
            />

            {/* Teams */}

            <Route
                path="/teams"
                element={
                    user
                        ? <Teams user={user} />
                        : <h2>Loading...</h2>
                }
            />

            {/* Decision */}

            <Route
                path="/decisions"
                element={<DecisionList />}
            />

            <Route
                path="/decisions/create"
                element={<CreateDecision />}
            />

            <Route
                path="/decisions/:id"
                element={<DecisionDetails />}
            />

            <Route
                path="/decisions/:id/edit"
                element={<EditDecision />}
            />

            {/* Decision Sub Pages */}

            <Route
                path="/decisions/:id/alternatives"
                element={<Alternatives />}
            />

            <Route
                path="/decisions/:id/knowledge"
                element={<Knowledge />}
            />

            <Route
                path="/decisions/:id/history"
                element={<VersionHistory />}
            />

            <Route
                path="/decisions/:id/attachments"
                element={<Attachment />}
            />

            {/* Discussion */}

           

            <Route
            path="/decisions/:decisionId/discussion"
            element={<DiscussionList />}
            />


            <Route
            path="/decisions/:decisionId/discussion/:id"
            element={<DiscussionDetails />}
            />          
           <Route
            path="/decisions/:decisionId/create-discussion"
            element={<CreateDiscussion />}
           />

            {/* Categories */}

            <Route
                path="/categories"
                element={<CategoryList />}
            />

            <Route
                path="/categories/create"
                element={<CreateCategory />}
            />

            <Route
                path="/categories/:id"
                element={<CategoryDetails />}
            />
                    
            <Route
                path="/decisions/:id/alternatives/add"
                element={<AddAlternative />}
            />
            <Route
                path="/alternatives/edit/:id"
                element={<EditAlternative />}
            />
            <Route
        path="/alternatives/:id"
        element={<ViewAlternative />}
    />
    <Route
    path="/assigned-decisions"
    element={<AssignedDecisions />}
/>
<Route path="/reviews" element={<MyReviews />} />
            </Routes>
            

    );

}

export default App;