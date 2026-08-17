--
-- PostgreSQL database dump
--

\restrict h4VTtcIsKXNZ52rsAmTE84Tx3a32Q1thdwZ2EGKBnGt7Bwdsau1bjnfpDQ8DEC8

-- Dumped from database version 17.10 (29ad1b7)
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: approvalaction; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.approvalaction AS ENUM (
    'approved',
    'rejected',
    'resubmitted'
);


ALTER TYPE public.approvalaction OWNER TO neondb_owner;

--
-- Name: decisionstatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.decisionstatus AS ENUM (
    'draft',
    'under_review',
    'approved',
    'rejected',
    'archived'
);


ALTER TYPE public.decisionstatus OWNER TO neondb_owner;

--
-- Name: discussionmessagetype; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.discussionmessagetype AS ENUM (
    'comment',
    'reply',
    'meeting_note'
);


ALTER TYPE public.discussionmessagetype OWNER TO neondb_owner;

--
-- Name: feasibilitylevel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.feasibilitylevel AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public.feasibilitylevel OWNER TO neondb_owner;

--
-- Name: risklevel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.risklevel AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public.risklevel OWNER TO neondb_owner;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.userrole AS ENUM (
    'employee',
    'reviewer',
    'manager',
    'admin'
);


ALTER TYPE public.userrole OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO neondb_owner;

--
-- Name: alternatives; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.alternatives (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    pros text,
    cons text,
    cost double precision,
    risk_level public.risklevel NOT NULL,
    feasibility public.feasibilitylevel NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alternatives OWNER TO neondb_owner;

--
-- Name: alternatives_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.alternatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alternatives_id_seq OWNER TO neondb_owner;

--
-- Name: alternatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.alternatives_id_seq OWNED BY public.alternatives.id;


--
-- Name: approvals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.approvals (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    action public.approvalaction NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    stage integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.approvals OWNER TO neondb_owner;

--
-- Name: approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approvals_id_seq OWNER TO neondb_owner;

--
-- Name: approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.approvals_id_seq OWNED BY public.approvals.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action character varying NOT NULL,
    entity_type character varying NOT NULL,
    entity_id integer,
    details text,
    created_at timestamp with time zone DEFAULT now(),
    log_type character varying NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: chat_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    decision_id integer,
    tab_type character varying NOT NULL,
    question text NOT NULL,
    answer text,
    created_at timestamp without time zone
);


ALTER TABLE public.chat_history OWNER TO neondb_owner;

--
-- Name: chat_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_history_id_seq OWNER TO neondb_owner;

--
-- Name: chat_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_history_id_seq OWNED BY public.chat_history.id;


--
-- Name: decision_versions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.decision_versions (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    version_number integer NOT NULL,
    title character varying NOT NULL,
    problem_statement text NOT NULL,
    category character varying,
    status character varying NOT NULL,
    changed_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.decision_versions OWNER TO neondb_owner;

--
-- Name: decision_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.decision_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.decision_versions_id_seq OWNER TO neondb_owner;

--
-- Name: decision_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.decision_versions_id_seq OWNED BY public.decision_versions.id;


--
-- Name: decisions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.decisions (
    id integer NOT NULL,
    title character varying NOT NULL,
    problem_statement text NOT NULL,
    category character varying,
    status public.decisionstatus NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    attachment_url character varying,
    assigned_reviewer_id integer,
    ai_summary text,
    ai_summary_updated_at timestamp without time zone
);


ALTER TABLE public.decisions OWNER TO neondb_owner;

--
-- Name: decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.decisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.decisions_id_seq OWNER TO neondb_owner;

--
-- Name: decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.decisions_id_seq OWNED BY public.decisions.id;


--
-- Name: discussion_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.discussion_messages (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_id integer,
    message text NOT NULL,
    message_type public.discussionmessagetype NOT NULL,
    attachment_url character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.discussion_messages OWNER TO neondb_owner;

--
-- Name: discussion_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.discussion_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discussion_messages_id_seq OWNER TO neondb_owner;

--
-- Name: discussion_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.discussion_messages_id_seq OWNED BY public.discussion_messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    link character varying(512),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: reviewer_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reviewer_assignments (
    id integer NOT NULL,
    category character varying NOT NULL,
    reviewer_id integer NOT NULL,
    assigned_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reviewer_assignments OWNER TO neondb_owner;

--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reviewer_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviewer_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reviewer_assignments_id_seq OWNED BY public.reviewer_assignments.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    manager_id integer
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO neondb_owner;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.uploaded_files (
    id character varying NOT NULL,
    filename character varying NOT NULL,
    file_path character varying NOT NULL,
    url character varying NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.uploaded_files OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    role public.userrole NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    team_id integer
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alternatives id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alternatives ALTER COLUMN id SET DEFAULT nextval('public.alternatives_id_seq'::regclass);


--
-- Name: approvals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approvals ALTER COLUMN id SET DEFAULT nextval('public.approvals_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: chat_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history ALTER COLUMN id SET DEFAULT nextval('public.chat_history_id_seq'::regclass);


--
-- Name: decision_versions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decision_versions ALTER COLUMN id SET DEFAULT nextval('public.decision_versions_id_seq'::regclass);


--
-- Name: decisions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decisions ALTER COLUMN id SET DEFAULT nextval('public.decisions_id_seq'::regclass);


--
-- Name: discussion_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discussion_messages ALTER COLUMN id SET DEFAULT nextval('public.discussion_messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: reviewer_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviewer_assignments ALTER COLUMN id SET DEFAULT nextval('public.reviewer_assignments_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.alembic_version (version_num) FROM stdin;
0d8b26bb5cfb
\.


--
-- Data for Name: alternatives; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.alternatives (id, decision_id, title, description, pros, cons, cost, risk_level, feasibility, created_at) FROM stdin;
2	1	string	string	string	string	500	MEDIUM	LOW	2026-07-18 11:45:09.173513+00
3	1	Use PostgreSQL instead of MySQL	Evaluating PostgreSQL as our primary database instead of MySQL, given our team's existing FastAPI backend setup.	Strong support for complex queries and JSON data, better suited for our relational data structure, free hosting available via Neon	Some team members have less prior experience with PostgreSQL compared to MySQL	0	LOW	HIGH	2026-07-20 04:04:05.526523+00
6	30	Manual Testing	continue testing manually	no automation setup required	time-consuming	0	MEDIUM	HIGH	2026-07-27 13:11:46.773075+00
7	31	continued testing manually	no need of complex automations.	avoid complexities	too slow	0	MEDIUM	HIGH	2026-07-27 13:19:04.745116+00
8	79	GitHub Actions CI	\N	\N	\N	0	LOW	HIGH	2026-08-16 13:43:52.617938+00
9	79	Jenkins self-hosted	\N	\N	\N	5	MEDIUM	MEDIUM	2026-08-16 13:44:53.239458+00
10	79	Keep manual process	\N	\N	\N	0	HIGH	HIGH	2026-08-16 13:45:22.944466+00
\.


--
-- Data for Name: approvals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.approvals (id, decision_id, reviewer_id, action, comment, created_at, stage) FROM stdin;
1	31	6	approved	Approved after budget clarification	2026-07-28 04:53:59.498855+00	1
2	31	6	rejected	Needs more detail on the budget impact before we can proceed.	2026-07-28 04:55:02.043971+00	1
3	31	5	approved	Looks Good to me	2026-07-28 05:20:26.063832+00	1
4	31	5	rejected	Need to change many things	2026-07-28 05:21:14.224041+00	1
5	31	5	approved		2026-07-28 05:21:21.182337+00	1
6	31	5	rejected	Need more improvements	2026-07-28 06:42:51.409874+00	1
7	30	6	approved		2026-07-28 06:45:19.630622+00	1
8	30	6	approved		2026-07-28 06:45:23.909442+00	1
9	30	6	approved		2026-07-28 06:45:43.283826+00	1
10	30	6	rejected	Not good	2026-07-28 06:55:30.212412+00	1
11	31	6	rejected	not good	2026-07-28 06:57:46.295046+00	1
12	31	7	resubmitted	Resubmitted for review after rejection	2026-07-30 05:08:57.028455+00	1
13	30	7	resubmitted	Resubmitted for review after rejection	2026-07-30 05:28:42.078777+00	1
14	31	5	rejected	Please provide a specific issue so that we can look for it.	2026-07-30 05:40:11.855826+00	1
15	31	7	resubmitted	Resubmitted for review after rejection	2026-07-30 05:42:50.889552+00	1
16	34	4	approved	Looks fine to me	2026-07-30 06:40:26.228578+00	1
17	34	5	approved	Looks fine to me	2026-07-30 06:43:09.447604+00	2
18	34	4	rejected	First try to learn about it completely, how it works and whether your team knows how to work on it.	2026-07-30 06:57:04.052216+00	3
19	26	4	approved	It looks good for me	2026-07-30 07:02:55.105358+00	1
20	26	5	approved		2026-07-30 07:03:49.862958+00	2
21	34	7	resubmitted	Resubmitted for review after rejection	2026-07-30 12:39:40.145869+00	1
22	33	4	approved	Looks good	2026-07-30 14:12:46.089708+00	1
23	33	5	approved		2026-07-30 14:13:25.598363+00	2
24	9	7	resubmitted	Resubmitted for review after rejection	2026-07-30 14:15:06.609778+00	1
25	34	5	rejected	Please make it proper	2026-07-31 13:05:43.272614+00	3
26	30	5	rejected	Make it proper	2026-07-31 13:17:27.55249+00	2
27	50	6	approved	tested	2026-08-01 13:20:58.23783+00	1
28	52	21	approved		2026-08-03 12:36:51.835004+00	1
29	54	4	approved		2026-08-03 13:06:26.066237+00	1
30	53	4	approved		2026-08-03 13:11:04.983787+00	1
31	28	21	approved	Good	2026-08-03 13:36:41.844255+00	1
32	52	5	rejected	Implement completely	2026-08-03 13:48:04.157656+00	2
33	49	21	approved		2026-08-04 13:12:56.449954+00	1
34	54	22	approved	Test Approved	2026-08-05 13:12:21.458015+00	2
35	49	6	approved		2026-08-06 11:55:08.854023+00	2
36	56	21	approved		2026-08-06 13:42:24.040692+00	1
37	56	5	rejected	Please check it out one	2026-08-06 13:44:20.46597+00	2
38	55	4	approved		2026-08-07 13:02:40.568052+00	1
39	25	4	approved		2026-08-08 07:06:46.977668+00	1
40	25	21	rejected	Not good	2026-08-08 07:07:32.855253+00	2
41	56	21	rejected	Not good	2026-08-08 07:30:27.478798+00	2
42	30	5	rejected	Need some more changes	2026-08-08 07:38:04.868865+00	2
43	49	6	rejected	Testing administrator rejection.	2026-08-08 07:39:53.028558+00	3
44	49	6	resubmitted	Resubmitted for review after rejection	2026-08-08 07:42:46.385487+00	1
45	49	21	approved		2026-08-08 07:49:20.550971+00	1
46	49	5	approved		2026-08-08 07:50:17.182775+00	2
47	57	21	rejected	While implementing Multi-Factor Authentication (MFA) is a critical and highly recommended security enhancement, the provided decision record is severely lacking in essential information required for proper review.	2026-08-16 13:30:09.251815+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, created_at, log_type) FROM stdin;
1	11	create	discussion_message	1	Created comment for decision 1	2026-07-17 06:47:24.76737+00	activity
2	11	create	discussion_message	2	Created reply to comment 1	2026-07-17 06:49:26.892464+00	activity
3	11	edit	discussion_message	1	Edited comment 1	2026-07-17 07:31:46.47214+00	activity
4	7	create	discussion_message	3	Created comment for decision 13	2026-07-18 09:31:54.119512+00	activity
5	7	create	discussion_message	4	Created meeting note for decision 13	2026-07-18 09:31:55.183285+00	activity
6	7	create	discussion_message	5	Created comment for decision 14	2026-07-18 09:50:50.03397+00	activity
7	7	create	discussion_message	6	Created meeting note for decision 14	2026-07-18 09:50:51.027571+00	activity
8	11	create	discussion_message	7	Created comment for decision 9	2026-07-18 09:59:35.721946+00	activity
9	11	create	discussion_message	8	Created reply to comment 7	2026-07-18 09:59:48.590966+00	activity
10	11	edit	discussion_message	8	Edited comment 8	2026-07-18 10:01:31.414234+00	activity
11	11	delete	discussion_message	8	Deleted comment 8	2026-07-18 10:01:38.665663+00	activity
12	11	create	discussion_message	9	Created comment for decision 10	2026-07-18 10:30:00.797008+00	activity
13	11	create	discussion_message	10	Created reply to comment 9	2026-07-18 10:30:43.839411+00	activity
14	7	create	discussion_message	11	Created comment for decision 1	2026-07-20 06:11:45.651526+00	activity
15	7	create	discussion_message	12	Created reply to comment 1	2026-07-20 06:13:49.09024+00	activity
16	7	create	discussion_message	13	Created meeting note for decision 1	2026-07-20 06:15:27.687301+00	activity
17	7	edit	discussion_message	13	Edited comment 13	2026-07-20 06:40:27.535681+00	activity
18	7	create	discussion_message	14	Created comment for decision 21	2026-07-23 11:55:17.650564+00	activity
19	7	create	discussion_message	15	Created meeting note for decision 21	2026-07-23 11:55:18.450156+00	activity
20	11	create	discussion_message	16	Created comment for decision 13	2026-07-23 12:18:13.695243+00	activity
21	7	create	discussion_message	17	Created comment for decision 25	2026-07-23 16:05:13.343119+00	activity
22	7	create	discussion_message	18	Created comment for decision 26	2026-07-23 16:05:28.894208+00	activity
23	7	create	discussion_message	19	Created meeting note for decision 26	2026-07-23 16:05:29.51186+00	activity
24	11	create	discussion_message	20	Created meeting note for decision 1	2026-07-23 16:09:25.621353+00	activity
25	16	create	discussion_message	21	Created comment for decision 28	2026-07-24 11:58:49.045507+00	activity
26	11	create	discussion_message	22	Created comment for decision 22	2026-07-24 13:27:09.606383+00	activity
27	11	create	discussion_message	23	Created reply to comment 21	2026-07-26 09:51:19.333773+00	activity
28	11	create	discussion_message	24	Created reply to comment 21	2026-07-26 09:51:26.577741+00	activity
29	11	create	discussion_message	25	Created reply to comment 21	2026-07-26 09:51:26.577923+00	activity
30	11	delete	discussion_message	25	Deleted comment 25	2026-07-26 09:51:49.101987+00	activity
31	11	delete	discussion_message	24	Deleted comment 24	2026-07-26 09:51:53.850558+00	activity
32	7	create	discussion_message	26	Created comment for decision 30	2026-07-27 06:55:35.746287+00	activity
33	11	create	discussion_message	27	Created meeting note for decision 30	2026-07-27 08:35:32.037202+00	activity
34	20	register	user	20	User registered with email: audit.test.6c0aed@example.com	2026-07-29 12:21:58.27764+00	security
35	20	login	user	20	User logged in successfully: audit.test.6c0aed@example.com	2026-07-29 12:21:59.094708+00	security
36	20	create	decision	32	Created decision: Audit Logging Test Decision	2026-07-29 12:22:00.07166+00	activity
37	20	list	decision	\N	Listed decisions	2026-07-29 12:22:00.914776+00	access
38	11	list	decision	\N	Listed decisions	2026-07-29 12:23:21.682284+00	access
39	11	list	user	\N	Admin listed all users	2026-07-29 12:23:23.130881+00	access
40	11	list	user	\N	Admin listed all users	2026-07-29 12:23:25.852197+00	access
41	11	list	decision	\N	Listed decisions	2026-07-29 12:23:25.752158+00	access
42	11	list	decision	\N	Listed decisions	2026-07-29 12:23:31.578473+00	access
43	11	list	decision	\N	Listed decisions	2026-07-29 12:23:36.720587+00	access
44	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-07-29 12:27:01.992075+00	security
45	11	list	user	\N	Admin listed all users	2026-07-29 12:27:03.409607+00	access
46	11	list	decision	\N	Listed decisions	2026-07-29 12:27:03.183446+00	access
47	11	list	user	\N	Admin listed all users	2026-07-29 12:27:06.441137+00	access
48	11	list	decision	\N	Listed decisions	2026-07-29 12:27:08.266178+00	access
49	11	list	decision	\N	Listed decisions	2026-07-29 12:27:12.754397+00	access
50	11	list	decision	\N	Listed decisions	2026-07-29 12:27:17.228947+00	access
51	16	list	decision	\N	Listed decisions	2026-07-30 10:44:11.412025+00	access
52	16	list	decision	\N	Listed decisions	2026-07-30 10:44:13.498007+00	access
53	16	list	decision	\N	Listed decisions	2026-07-30 10:44:16.865207+00	access
54	16	list	decision	\N	Listed decisions	2026-07-30 10:44:18.971036+00	access
55	16	list	decision	\N	Listed decisions	2026-07-30 10:44:21.416227+00	access
56	16	list	decision	\N	Listed decisions	2026-07-30 10:44:23.710723+00	access
57	16	list	decision	\N	Listed decisions	2026-07-30 10:44:32.841479+00	access
58	16	list	decision	\N	Listed decisions	2026-07-30 10:44:35.293977+00	access
59	16	list	decision	\N	Listed decisions	2026-07-30 10:44:37.789179+00	access
60	16	list	decision	\N	Listed decisions	2026-07-30 10:44:39.908818+00	access
61	16	list	decision	\N	Listed decisions	2026-07-30 10:44:42.335762+00	access
62	16	list	decision	\N	Listed decisions	2026-07-30 10:44:44.651185+00	access
63	16	list	decision	\N	Listed decisions	2026-07-30 10:44:46.775911+00	access
64	16	list	decision	\N	Listed decisions	2026-07-30 10:44:49.179985+00	access
65	16	list	decision	\N	Listed decisions	2026-07-30 10:44:51.483207+00	access
66	16	list	decision	\N	Listed decisions	2026-07-30 10:44:53.631128+00	access
67	16	list	decision	\N	Listed decisions	2026-07-30 10:44:58.175045+00	access
68	16	list	decision	\N	Listed decisions	2026-07-30 10:45:00.49723+00	access
69	16	list	decision	\N	Listed decisions	2026-07-30 10:45:02.585349+00	access
70	16	list	decision	\N	Listed decisions	2026-07-30 10:45:04.965511+00	access
71	16	list	decision	\N	Listed decisions	2026-07-30 10:45:07.290482+00	access
72	16	list	decision	\N	Listed decisions	2026-07-30 10:45:09.394581+00	access
73	16	list	decision	\N	Listed decisions	2026-07-30 10:45:19.414538+00	access
74	16	list	decision	\N	Listed decisions	2026-07-30 10:45:21.784749+00	access
75	16	list	decision	\N	Listed decisions	2026-07-30 10:45:24.35446+00	access
76	16	list	decision	\N	Listed decisions	2026-07-30 10:45:28.576314+00	access
80	16	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-30 10:46:48.791098+00	access
77	16	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-30 10:46:44.86598+00	access
79	16	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-30 10:46:46.226893+00	access
82	16	view_versions	decision	31	Viewed versions for decision 31	2026-07-30 10:47:30.475216+00	access
85	16	list_alternatives	decision	31	Viewed alternatives list for decision 31	2026-07-30 10:49:23.097918+00	access
88	16	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-30 10:49:39.255593+00	access
1228	21	list	decision	\N	Listed decisions	2026-08-04 13:11:04.369305+00	access
1656	6	list	decision	\N	Listed decisions	2026-08-14 05:58:04.787739+00	access
1717	6	list	decision	\N	Listed decisions	2026-08-14 13:27:51.412043+00	access
1748	6	list	decision	\N	Listed decisions	2026-08-14 16:35:45.477744+00	access
1752	6	list	decision	\N	Listed decisions	2026-08-14 16:36:06.763193+00	access
1809	5	list	decision	\N	Listed decisions	2026-08-15 11:35:08.960369+00	access
1854	6	login	user	6	User logged in successfully	2026-08-15 15:52:46.226763+00	security
1999	21	list	decision	\N	Listed decisions	2026-08-16 13:19:56.349191+00	access
2001	21	list	decision	\N	Listed decisions	2026-08-16 13:20:01.354783+00	access
2008	21	list	decision	\N	Listed decisions	2026-08-16 13:22:31.599803+00	access
2014	21	list	decision	\N	Listed decisions	2026-08-16 13:22:38.789242+00	access
2020	21	list	decision	\N	Listed decisions	2026-08-16 13:24:23.999597+00	access
78	16	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-30 10:46:46.035809+00	access
81	16	view_versions	decision	31	Viewed versions for decision 31	2026-07-30 10:47:29.735527+00	access
84	16	export_pdf	decision	31	Exported decision 31 as PDF	2026-07-30 10:48:18.328576+00	access
87	16	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-30 10:49:38.058742+00	access
1229	4	list	decision	\N	Listed decisions	2026-08-04 13:11:21.644886+00	access
1231	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:11:39.329979+00	access
1233	4	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:11:41.319921+00	access
1241	21	list	decision	\N	Listed decisions	2026-08-04 13:12:32.919966+00	access
1246	21	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:12:46.60995+00	access
1249	21	view	decision	49	Viewed decision: text	2026-08-04 13:13:10.849816+00	access
1253	21	list	decision	\N	Listed decisions	2026-08-04 13:13:25.894929+00	access
1259	5	list	decision	\N	Listed decisions	2026-08-04 13:13:49.245557+00	access
1267	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:17:18.935135+00	access
1657	6	list	decision	\N	Listed decisions	2026-08-14 05:59:28.223906+00	access
1658	6	list	decision	\N	Listed decisions	2026-08-14 05:59:29.315636+00	access
1719	11	list	decision	\N	Listed decisions	2026-08-14 13:29:01.591542+00	access
1750	6	list	decision	\N	Listed decisions	2026-08-14 16:35:47.279728+00	access
1753	6	list	decision	\N	Listed decisions	2026-08-14 16:36:06.763644+00	access
1855	7	login	user	7	User logged in successfully	2026-08-15 16:40:28.41944+00	security
1860	7	list	decision	\N	Listed decisions	2026-08-15 16:44:15.164284+00	access
2006	21	list	decision	\N	Listed decisions	2026-08-16 13:20:13.695982+00	access
2010	21	list	decision	\N	Listed decisions	2026-08-16 13:22:33.742865+00	access
2019	21	list	decision	\N	Listed decisions	2026-08-16 13:24:13.767789+00	access
83	16	export_pdf	decision	31	Exported decision 31 as PDF	2026-07-30 10:48:17.015241+00	access
86	16	list_alternatives	decision	31	Viewed alternatives list for decision 31	2026-07-30 10:49:23.714614+00	access
89	16	list	decision	\N	Listed decisions	2026-07-30 10:53:57.77584+00	access
90	16	list	decision	\N	Listed decisions	2026-07-30 10:54:00.081401+00	access
91	16	list	decision	\N	Listed decisions	2026-07-30 11:02:42.358987+00	access
92	16	list	decision	\N	Listed decisions	2026-07-30 11:04:57.945371+00	access
93	16	list	decision	\N	Listed decisions	2026-07-30 11:04:59.957479+00	access
94	16	list	decision	\N	Listed decisions	2026-07-30 11:05:02.173445+00	access
95	16	list	decision	\N	Listed decisions	2026-07-30 11:05:04.067669+00	access
96	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-07-30 13:19:30.336212+00	security
97	11	list	decision	\N	Listed decisions	2026-07-30 13:19:33.183982+00	access
98	11	list	user	\N	Admin listed all users	2026-07-30 13:19:33.712463+00	access
99	11	list	user	\N	Admin listed all users	2026-07-30 13:19:35.451139+00	access
100	11	list	decision	\N	Listed decisions	2026-07-30 13:19:35.700714+00	access
101	11	list	decision	\N	Listed decisions	2026-07-30 13:19:38.114086+00	access
102	11	list	decision	\N	Listed decisions	2026-07-30 13:19:41.566901+00	access
103	11	list	decision	\N	Listed decisions	2026-07-30 13:19:46.176752+00	access
104	11	list	decision	\N	Listed decisions	2026-07-30 13:19:49.699109+00	access
105	11	list	decision	\N	Listed decisions	2026-07-30 13:19:54.325432+00	access
106	11	list	decision	\N	Listed decisions	2026-07-30 13:19:57.417396+00	access
107	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-30 13:24:06.59171+00	security
108	16	list	decision	\N	Listed decisions	2026-07-30 13:24:07.58515+00	access
109	16	list	decision	\N	Listed decisions	2026-07-30 13:24:09.442253+00	access
110	16	list	decision	\N	Listed decisions	2026-07-30 13:24:11.69038+00	access
111	16	list	decision	\N	Listed decisions	2026-07-30 13:24:13.550046+00	access
112	5	login	user	5	User logged in successfully: manager.test@example.com	2026-07-30 13:39:18.73396+00	security
113	5	list	decision	\N	Listed decisions	2026-07-30 13:39:20.718695+00	access
114	5	list	decision	\N	Listed decisions	2026-07-30 13:39:23.893954+00	access
115	7	login	user	7	User logged in successfully: employee.test@example.com	2026-07-30 13:39:26.394073+00	security
116	5	list	decision	\N	Listed decisions	2026-07-30 13:39:26.983514+00	access
117	5	list	decision	\N	Listed decisions	2026-07-30 13:39:30.178654+00	access
118	7	list	decision	\N	Listed decisions	2026-07-30 13:39:33.293644+00	access
119	7	list	decision	\N	Listed decisions	2026-07-30 13:39:36.333528+00	access
120	7	list	decision	\N	Listed decisions	2026-07-30 13:39:39.663712+00	access
121	7	list	decision	\N	Listed decisions	2026-07-30 13:39:42.683403+00	access
122	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-07-30 13:43:29.563634+00	security
123	4	list	decision	\N	Listed decisions	2026-07-30 13:43:31.013594+00	access
124	4	list	decision	\N	Listed decisions	2026-07-30 13:43:34.523907+00	access
125	4	list	decision	\N	Listed decisions	2026-07-30 13:43:39.323998+00	access
126	4	list	decision	\N	Listed decisions	2026-07-30 13:43:45.17907+00	access
127	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-30 13:44:57.587023+00	access
128	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-30 13:44:59.58915+00	access
129	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-30 13:45:00.384103+00	access
130	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-30 13:45:02.312842+00	access
131	4	view_versions	decision	34	Viewed versions for decision 34	2026-07-30 13:45:03.113958+00	access
132	4	view_versions	decision	34	Viewed versions for decision 34	2026-07-30 13:45:04.465326+00	access
133	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-30 13:45:04.360148+00	access
134	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-30 13:45:06.463043+00	access
135	4	list	decision	\N	Listed decisions	2026-07-30 14:10:51.934785+00	access
136	4	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:11:09.514667+00	access
137	4	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:11:10.318461+00	access
138	4	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:11:11.689747+00	access
139	4	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:11:12.605328+00	access
140	5	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:11:21.817838+00	access
141	5	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:11:23.427489+00	access
142	5	update_status	decision	33	Updated status of decision 33 from draft to under_review	2026-07-30 14:11:25.504813+00	activity
143	4	list	decision	\N	Listed decisions	2026-07-30 14:11:36.140271+00	access
144	4	list	decision	\N	Listed decisions	2026-07-30 14:11:40.689709+00	access
145	4	list	decision	\N	Listed decisions	2026-07-30 14:11:44.933622+00	access
146	4	list	decision	\N	Listed decisions	2026-07-30 14:11:49.500382+00	access
147	4	list	decision	\N	Listed decisions	2026-07-30 14:11:54.290394+00	access
148	4	list	decision	\N	Listed decisions	2026-07-30 14:11:59.098119+00	access
149	4	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:12:35.975557+00	access
150	4	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:12:37.019927+00	access
151	4	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:12:37.420385+00	access
152	4	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:12:38.054714+00	access
153	4	approve	decision	33	Approved decision 33 with comment: Looks good	2026-07-30 14:12:46.770234+00	activity
154	4	view	decision	33	Viewed decision: test decision	2026-07-30 14:12:47.72985+00	access
155	4	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:12:47.72992+00	access
156	5	list	decision	\N	Listed decisions	2026-07-30 14:13:07.584998+00	access
157	5	list	decision	\N	Listed decisions	2026-07-30 14:13:11.503506+00	access
158	5	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:13:13.729995+00	access
159	5	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-30 14:13:14.525181+00	access
160	5	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:13:15.264706+00	access
161	5	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:13:16.36991+00	access
162	5	approve	decision	33	Approved decision 33 with comment: 	2026-07-30 14:13:27.885214+00	activity
163	5	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-30 14:13:29.584849+00	access
164	5	view	decision	33	Viewed decision: test decision	2026-07-30 14:13:29.582988+00	access
165	5	list	decision	\N	Listed decisions	2026-07-30 14:14:23.007937+00	access
166	5	list	decision	\N	Listed decisions	2026-07-30 14:14:27.255418+00	access
167	7	list	decision	\N	Listed decisions	2026-07-30 14:14:33.489733+00	access
170	7	view_discussion	decision	9	Viewed discussion thread for decision 9	2026-07-30 14:14:58.129681+00	access
175	7	view_approvals	decision	9	Viewed approvals for decision 9	2026-07-30 14:15:08.205038+00	access
176	7	view_versions	decision	9	Viewed versions for decision 9	2026-07-30 14:15:20.364871+00	access
179	7	view_approvals	decision	9	Viewed approvals for decision 9	2026-07-30 14:15:29.569623+00	access
180	7	update	decision	9	Updated decision 9 (version snapshot v1 saved)	2026-07-30 14:15:35.895337+00	activity
183	7	view_discussion	decision	9	Viewed discussion thread for decision 9	2026-07-30 14:18:11.349738+00	access
186	7	list	decision	\N	Listed decisions	2026-07-30 14:18:19.934816+00	access
1230	4	list	decision	\N	Listed decisions	2026-08-04 13:11:26.298943+00	access
1232	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:11:40.459102+00	access
1234	4	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:11:42.053784+00	access
1247	21	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:12:48.134204+00	access
1265	5	list	decision	\N	Listed decisions	2026-08-04 13:17:13.663722+00	access
1268	5	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:17:19.254375+00	access
1659	6	list	decision	\N	Listed decisions	2026-08-14 05:59:27.974088+00	access
1720	11	list	decision	\N	Listed decisions	2026-08-14 13:29:02.661203+00	access
1751	6	list	decision	\N	Listed decisions	2026-08-14 16:35:58.672692+00	access
1856	7	list	decision	\N	Listed decisions	2026-08-15 16:40:31.289455+00	access
2013	21	list	decision	\N	Listed decisions	2026-08-16 13:22:35.087434+00	access
2056	7	login	user	7	User logged in successfully	2026-08-17 06:19:39.274941+00	security
2057	7	list	decision	\N	Listed decisions	2026-08-17 06:19:42.500857+00	access
2059	7	list	decision	\N	Listed decisions	2026-08-17 06:19:49.065973+00	access
2060	7	list	decision	\N	Listed decisions	2026-08-17 06:19:52.137863+00	access
2064	21	list	decision	\N	Listed decisions	2026-08-17 06:22:12.422753+00	access
2067	21	list	decision	\N	Listed decisions	2026-08-17 06:29:25.73543+00	access
2068	21	list	decision	\N	Listed decisions	2026-08-17 06:33:20.439786+00	access
2070	21	login	user	21	User logged in successfully	2026-08-17 07:21:57.765407+00	security
2075	21	list	decision	\N	Listed decisions	2026-08-17 07:22:03.24262+00	access
168	7	list	decision	\N	Listed decisions	2026-07-30 14:14:37.403128+00	access
171	7	view_approvals	decision	9	Viewed approvals for decision 9	2026-07-30 14:15:00.247904+00	access
178	7	view_approvals	decision	9	Viewed approvals for decision 9	2026-07-30 14:15:28.367882+00	access
182	7	list	decision	\N	Listed decisions	2026-07-30 14:16:41.013605+00	access
185	7	list	decision	\N	Listed decisions	2026-07-30 14:18:15.578341+00	access
188	7	view_discussion	decision	29	Viewed discussion thread for decision 29	2026-07-30 14:18:27.902831+00	access
1235	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-04 13:12:22.47978+00	security
1237	16	list	decision	\N	Listed decisions	2026-08-04 13:12:25.81176+00	access
1239	16	list	decision	\N	Listed decisions	2026-08-04 13:12:30.774663+00	access
1242	16	list	decision	\N	Listed decisions	2026-08-04 13:12:35.478246+00	access
1660	6	list	decision	\N	Listed decisions	2026-08-14 05:59:36.147434+00	access
1721	6	list	decision	\N	Listed decisions	2026-08-14 13:31:04.963254+00	access
1857	7	list	decision	\N	Listed decisions	2026-08-15 16:40:30.79975+00	access
1859	7	list	decision	\N	Listed decisions	2026-08-15 16:40:39.084237+00	access
1861	7	list	decision	\N	Listed decisions	2026-08-15 16:44:25.563701+00	access
2023	21	list	decision	\N	Listed decisions	2026-08-16 13:25:46.127145+00	access
2058	7	list	decision	\N	Listed decisions	2026-08-17 06:19:42.976045+00	access
2061	7	list	decision	\N	Listed decisions	2026-08-17 06:21:37.533838+00	access
2062	7	list	decision	\N	Listed decisions	2026-08-17 06:21:39.680615+00	access
2063	21	login	user	21	User logged in successfully	2026-08-17 06:22:09.99196+00	security
2065	21	list	decision	\N	Listed decisions	2026-08-17 06:22:13.064808+00	access
2066	21	list	decision	\N	Listed decisions	2026-08-17 06:22:19.651116+00	access
2069	21	list	decision	\N	Listed decisions	2026-08-17 06:33:20.97676+00	access
2071	21	list	decision	\N	Listed decisions	2026-08-17 07:22:00.369044+00	access
2073	21	list	decision	\N	Listed decisions	2026-08-17 07:22:02.104961+00	access
2076	21	list	decision	\N	Listed decisions	2026-08-17 07:22:06.437312+00	access
169	7	view_discussion	decision	9	Viewed discussion thread for decision 9	2026-07-30 14:14:57.180328+00	access
172	7	view_approvals	decision	9	Viewed approvals for decision 9	2026-07-30 14:15:01.105281+00	access
173	7	resubmit	decision	9	Resubmitted decision 9 for review	2026-07-30 14:15:07.330282+00	activity
174	7	view	decision	9	Viewed decision: Migrate to shared cloud database	2026-07-30 14:15:08.209787+00	access
177	7	view_versions	decision	9	Viewed versions for decision 9	2026-07-30 14:15:21.244848+00	access
181	7	list	decision	\N	Listed decisions	2026-07-30 14:16:36.605415+00	access
184	7	view_discussion	decision	9	Viewed discussion thread for decision 9	2026-07-30 14:18:12.374984+00	access
187	7	view_discussion	decision	29	Viewed discussion thread for decision 29	2026-07-30 14:18:27.169956+00	access
189	7	export_pdf	decision	29	Exported decision 29 as PDF	2026-07-30 14:31:42.118773+00	access
190	7	list_alternatives	decision	29	Viewed alternatives list for decision 29	2026-07-30 14:34:34.8448+00	access
191	7	list_alternatives	decision	29	Viewed alternatives list for decision 29	2026-07-30 14:34:35.53285+00	access
192	7	create	discussion_message	28	Created meeting note for decision 29	2026-07-30 14:35:40.222856+00	activity
193	7	view_discussion	decision	29	Viewed discussion thread for decision 29	2026-07-30 14:35:41.168987+00	access
194	7	delete	discussion_message	28	Deleted comment 28	2026-07-30 14:37:33.088128+00	activity
195	7	view_discussion	decision	29	Viewed discussion thread for decision 29	2026-07-30 14:37:33.969233+00	access
196	7	create	discussion_message	29	Created meeting note for decision 29	2026-07-30 14:38:43.353401+00	activity
197	7	view_discussion	decision	29	Viewed discussion thread for decision 29	2026-07-30 14:38:44.458273+00	access
198	7	login	user	7	User logged in successfully: employee.test@example.com	2026-07-31 04:16:43.085844+00	security
199	6	login	user	6	User logged in successfully: admin.test@example.com	2026-07-31 04:17:49.797029+00	security
200	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 10:17:18.943453+00	security
201	16	list	decision	\N	Listed decisions	2026-07-31 10:17:20.077101+00	access
202	16	list	decision	\N	Listed decisions	2026-07-31 10:17:22.370912+00	access
203	16	list	decision	\N	Listed decisions	2026-07-31 10:17:24.956808+00	access
204	16	list	decision	\N	Listed decisions	2026-07-31 10:17:25.942738+00	access
205	16	list	decision	\N	Listed decisions	2026-07-31 10:17:28.508582+00	access
206	16	list	decision	\N	Listed decisions	2026-07-31 10:17:30.777417+00	access
207	16	list	decision	\N	Listed decisions	2026-07-31 10:17:33.362546+00	access
208	16	list	decision	\N	Listed decisions	2026-07-31 10:17:35.0177+00	access
209	16	list	decision	\N	Listed decisions	2026-07-31 10:18:34.21358+00	access
210	16	list	decision	\N	Listed decisions	2026-07-31 10:18:36.460602+00	access
211	16	list	decision	\N	Listed decisions	2026-07-31 10:18:39.041795+00	access
212	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 10:41:35.425041+00	security
213	16	list	decision	\N	Listed decisions	2026-07-31 10:41:36.505754+00	access
214	16	list	decision	\N	Listed decisions	2026-07-31 10:41:39.076326+00	access
215	16	list	decision	\N	Listed decisions	2026-07-31 10:41:41.318801+00	access
216	16	list	decision	\N	Listed decisions	2026-07-31 10:41:43.685503+00	access
217	16	list	decision	\N	Listed decisions	2026-07-31 10:50:26.651065+00	access
218	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 10:50:56.417017+00	security
219	16	list	decision	\N	Listed decisions	2026-07-31 10:50:57.044185+00	access
220	16	list	decision	\N	Listed decisions	2026-07-31 10:50:59.109205+00	access
221	16	list	decision	\N	Listed decisions	2026-07-31 10:51:01.46503+00	access
222	16	list	decision	\N	Listed decisions	2026-07-31 10:51:03.391612+00	access
223	16	list	decision	\N	Listed decisions	2026-07-31 10:54:57.533903+00	access
224	16	list	decision	\N	Listed decisions	2026-07-31 10:54:59.558799+00	access
225	16	list	decision	\N	Listed decisions	2026-07-31 10:55:01.839821+00	access
226	16	list	decision	\N	Listed decisions	2026-07-31 10:55:03.713418+00	access
227	16	list	decision	\N	Listed decisions	2026-07-31 11:03:54.566285+00	access
228	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 11:04:08.372701+00	security
229	16	list	decision	\N	Listed decisions	2026-07-31 11:04:09.043689+00	access
230	16	list	decision	\N	Listed decisions	2026-07-31 11:04:11.107928+00	access
231	16	list	decision	\N	Listed decisions	2026-07-31 11:04:13.644593+00	access
232	16	list	decision	\N	Listed decisions	2026-07-31 11:04:15.965286+00	access
233	16	list	decision	\N	Listed decisions	2026-07-31 11:04:18.026231+00	access
234	16	list	decision	\N	Listed decisions	2026-07-31 11:04:20.600552+00	access
235	16	list	decision	\N	Listed decisions	2026-07-31 11:04:38.888005+00	access
236	16	list	decision	\N	Listed decisions	2026-07-31 11:04:40.954557+00	access
237	16	list	decision	\N	Listed decisions	2026-07-31 11:04:43.527669+00	access
238	16	list	decision	\N	Listed decisions	2026-07-31 11:04:45.868203+00	access
239	16	list	decision	\N	Listed decisions	2026-07-31 11:04:47.937484+00	access
240	16	list	decision	\N	Listed decisions	2026-07-31 11:04:50.505289+00	access
241	16	create	decision	35	Created decision: Direct File Association in Decision Workspace	2026-07-31 11:13:01.042572+00	activity
242	16	list	decision	\N	Listed decisions	2026-07-31 11:13:01.785174+00	access
243	16	list	decision	\N	Listed decisions	2026-07-31 11:13:03.877218+00	access
244	16	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:13:15.529619+00	access
245	16	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:13:15.939639+00	access
246	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:13:23.659796+00	access
247	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:13:24.104807+00	access
248	16	compare_alternatives	decision	35	Compared alternatives for decision 35	2026-07-31 11:13:25.657438+00	access
249	16	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:13:39.368812+00	access
250	16	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:13:39.808192+00	access
251	16	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:13:41.22443+00	access
252	16	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:13:41.738996+00	access
253	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:13:42.857632+00	access
254	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:13:43.251725+00	access
255	16	list	decision	\N	Listed decisions	2026-07-31 11:13:45.338579+00	access
256	16	list	decision	\N	Listed decisions	2026-07-31 11:13:47.843936+00	access
257	5	login	user	5	User logged in successfully: manager.test@example.com	2026-07-31 11:14:44.190026+00	security
258	5	list	decision	\N	Listed decisions	2026-07-31 11:14:44.807678+00	access
259	5	list	decision	\N	Listed decisions	2026-07-31 11:14:47.545713+00	access
260	5	list	decision	\N	Listed decisions	2026-07-31 11:14:49.565548+00	access
263	5	list	decision	\N	Listed decisions	2026-07-31 11:14:56.323713+00	access
296	6	list	user	\N	Admin listed all users	2026-07-31 11:17:08.439896+00	access
298	6	list	user	\N	Admin listed all users	2026-07-31 11:17:09.850228+00	access
305	6	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:17:50.646004+00	access
1236	16	list	decision	\N	Listed decisions	2026-08-04 13:12:23.445903+00	access
1238	16	list	decision	\N	Listed decisions	2026-08-04 13:12:28.167598+00	access
1240	16	list	decision	\N	Listed decisions	2026-08-04 13:12:33.142128+00	access
1661	6	list	decision	\N	Listed decisions	2026-08-14 06:04:58.925123+00	access
1722	6	list	decision	\N	Listed decisions	2026-08-14 13:31:04.277306+00	access
1858	7	list	decision	\N	Listed decisions	2026-08-15 16:40:35.458762+00	access
2024	21	list	decision	\N	Listed decisions	2026-08-16 13:25:52.501607+00	access
2072	21	list	decision	\N	Listed decisions	2026-08-17 07:22:01.219717+00	access
2074	21	list	decision	\N	Listed decisions	2026-08-17 07:22:02.848119+00	access
2077	21	create	discussion_message	50	Created comment for decision 78	2026-08-17 07:24:28.224622+00	activity
261	5	list	decision	\N	Listed decisions	2026-07-31 11:14:51.700568+00	access
264	5	list	decision	\N	Listed decisions	2026-07-31 11:14:58.466324+00	access
267	5	list	decision	\N	Listed decisions	2026-07-31 11:15:04.978557+00	access
269	5	list	decision	\N	Listed decisions	2026-07-31 11:15:10.013705+00	access
272	4	list	decision	\N	Listed decisions	2026-07-31 11:15:55.056395+00	access
274	4	list	decision	\N	Listed decisions	2026-07-31 11:15:59.880434+00	access
276	4	list	decision	\N	Listed decisions	2026-07-31 11:16:04.580911+00	access
278	4	list	decision	\N	Listed decisions	2026-07-31 11:16:09.241939+00	access
280	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:16:12.059691+00	access
282	4	list	decision	\N	Listed decisions	2026-07-31 11:16:17.487944+00	access
284	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:16:19.834697+00	access
286	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:16:24.547721+00	access
288	4	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:16:25.384701+00	access
290	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:16:26.927275+00	access
292	4	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:16:29.088902+00	access
294	4	list	decision	\N	Listed decisions	2026-07-31 11:16:34.23596+00	access
299	6	list	decision	\N	Listed decisions	2026-07-31 11:17:10.360498+00	access
304	6	update_status	decision	35	Updated status of decision 35 from draft to under_review	2026-07-31 11:17:42.618394+00	activity
306	6	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:17:51.123777+00	access
1243	21	list	decision	\N	Listed decisions	2026-08-04 13:12:38.047677+00	access
1245	21	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:12:45.967804+00	access
1255	21	list	decision	\N	Listed decisions	2026-08-04 13:13:28.452778+00	access
1257	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:13:47.808144+00	security
1263	5	list	decision	\N	Listed decisions	2026-08-04 13:13:55.72848+00	access
1662	6	list	decision	\N	Listed decisions	2026-08-14 06:04:57.461071+00	access
1664	6	list	decision	\N	Listed decisions	2026-08-14 06:05:02.512698+00	access
1724	6	list	decision	\N	Listed decisions	2026-08-14 13:31:09.838911+00	access
1862	7	list	decision	\N	Listed decisions	2026-08-15 16:45:57.649205+00	access
1864	7	list	decision	\N	Listed decisions	2026-08-15 16:47:24.193778+00	access
2025	21	list	decision	\N	Listed decisions	2026-08-16 13:30:35.824911+00	access
2027	21	list	decision	\N	Listed decisions	2026-08-16 13:30:39.014973+00	access
262	5	list	decision	\N	Listed decisions	2026-07-31 11:14:54.316392+00	access
265	5	list	decision	\N	Listed decisions	2026-07-31 11:15:00.946452+00	access
266	5	list	decision	\N	Listed decisions	2026-07-31 11:15:02.593488+00	access
268	5	list	decision	\N	Listed decisions	2026-07-31 11:15:07.545326+00	access
270	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-07-31 11:15:51.952801+00	security
271	4	list	decision	\N	Listed decisions	2026-07-31 11:15:52.541204+00	access
273	4	list	decision	\N	Listed decisions	2026-07-31 11:15:57.178756+00	access
275	4	list	decision	\N	Listed decisions	2026-07-31 11:16:02.103719+00	access
277	4	list	decision	\N	Listed decisions	2026-07-31 11:16:06.763244+00	access
279	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:16:11.598627+00	access
281	4	list	decision	\N	Listed decisions	2026-07-31 11:16:14.659876+00	access
283	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:16:19.375797+00	access
285	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:16:24.110316+00	access
287	4	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:16:24.951829+00	access
289	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:16:26.49685+00	access
291	4	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:16:28.64158+00	access
293	4	list	decision	\N	Listed decisions	2026-07-31 11:16:31.455855+00	access
295	6	login	user	6	User logged in successfully: admin.test@example.com	2026-07-31 11:17:07.746457+00	security
297	6	list	decision	\N	Listed decisions	2026-07-31 11:17:08.334466+00	access
300	6	list	decision	\N	Listed decisions	2026-07-31 11:17:12.727848+00	access
301	6	list	decision	\N	Listed decisions	2026-07-31 11:17:14.743952+00	access
302	6	list	decision	\N	Listed decisions	2026-07-31 11:17:35.215149+00	access
303	6	list	decision	\N	Listed decisions	2026-07-31 11:17:37.283424+00	access
307	6	list	decision	\N	Listed decisions	2026-07-31 11:17:59.893315+00	access
308	6	list	decision	\N	Listed decisions	2026-07-31 11:18:02.07942+00	access
309	6	update_status	decision	35	Updated status of decision 35 from under_review to archived	2026-07-31 11:18:26.569501+00	activity
310	6	update_status	decision	35	Updated status of decision 35 from archived to under_review	2026-07-31 11:18:29.861747+00	activity
311	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-07-31 11:19:14.082936+00	security
312	4	list	decision	\N	Listed decisions	2026-07-31 11:19:14.665555+00	access
313	4	list	decision	\N	Listed decisions	2026-07-31 11:19:16.776079+00	access
314	4	list	decision	\N	Listed decisions	2026-07-31 11:19:18.96974+00	access
315	4	list	decision	\N	Listed decisions	2026-07-31 11:19:21.027625+00	access
316	4	list	decision	\N	Listed decisions	2026-07-31 11:19:23.212029+00	access
317	4	list	decision	\N	Listed decisions	2026-07-31 11:19:25.269561+00	access
318	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:19:27.275712+00	access
319	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 11:19:27.684489+00	access
320	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:19:31.066038+00	access
321	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:19:31.471567+00	access
322	4	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:19:38.178639+00	access
323	4	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 11:19:38.588186+00	access
324	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:19:39.494561+00	access
325	4	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 11:19:39.902645+00	access
326	4	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:19:43.830017+00	access
327	4	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 11:19:44.435928+00	access
328	4	list	decision	\N	Listed decisions	2026-07-31 11:19:58.851011+00	access
329	4	list	decision	\N	Listed decisions	2026-07-31 11:20:00.934889+00	access
330	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-07-31 11:20:35.891549+00	security
331	15	list	decision	\N	Listed decisions	2026-07-31 11:20:36.458833+00	access
332	15	list	decision	\N	Listed decisions	2026-07-31 11:20:38.528432+00	access
333	15	list	decision	\N	Listed decisions	2026-07-31 11:20:40.704105+00	access
334	15	list	decision	\N	Listed decisions	2026-07-31 11:20:43.514444+00	access
335	15	list	decision	\N	Listed decisions	2026-07-31 11:20:45.671798+00	access
336	15	list	decision	\N	Listed decisions	2026-07-31 11:20:48.111177+00	access
337	15	list	decision	\N	Listed decisions	2026-07-31 11:20:51.964425+00	access
338	15	list	decision	\N	Listed decisions	2026-07-31 11:20:54.002827+00	access
339	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 12:10:02.993479+00	security
340	16	list	decision	\N	Listed decisions	2026-07-31 12:10:04.141844+00	access
341	16	list	decision	\N	Listed decisions	2026-07-31 12:10:06.057044+00	access
342	16	list	decision	\N	Listed decisions	2026-07-31 12:10:08.66979+00	access
343	16	list	decision	\N	Listed decisions	2026-07-31 12:10:11.741779+00	access
344	16	list	decision	\N	Listed decisions	2026-07-31 12:10:14.067247+00	access
345	16	list	decision	\N	Listed decisions	2026-07-31 12:10:16.224796+00	access
346	16	create	decision	36	Created decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:10:29.018914+00	activity
347	16	create	decision	37	Created decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:10:30.520334+00	activity
348	16	create	decision	38	Created decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:10:34.552367+00	activity
349	16	create	decision	39	Created decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:10:37.833779+00	activity
350	16	create	decision	40	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:11:46.082163+00	activity
351	16	create	decision	41	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:11:48.133455+00	activity
352	16	create	decision	42	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:11:51.029691+00	activity
353	16	create	decision	43	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:11:52.951963+00	activity
413	5	list	decision	\N	Listed decisions	2026-07-31 13:06:13.068436+00	access
414	7	login	user	7	User logged in successfully: employee.test@example.com	2026-07-31 13:06:18.187862+00	security
354	16	create	decision	44	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:14:21.275878+00	activity
355	16	create	decision	45	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:14:23.437648+00	activity
356	16	create	decision	46	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:14:34.637629+00	activity
357	16	create	decision	47	Created decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:14:45.087836+00	activity
358	16	list	decision	\N	Listed decisions	2026-07-31 12:30:52.010112+00	access
359	16	list	decision	\N	Listed decisions	2026-07-31 12:30:55.245112+00	access
360	16	list	decision	\N	Listed decisions	2026-07-31 12:30:57.873046+00	access
361	16	list	decision	\N	Listed decisions	2026-07-31 12:31:00.762936+00	access
362	16	create	decision	48	Created decision: Direct File Association in Decision Workspace	2026-07-31 12:31:20.401362+00	activity
363	16	list	decision	\N	Listed decisions	2026-07-31 12:31:20.914427+00	access
364	16	list	decision	\N	Listed decisions	2026-07-31 12:31:24.137215+00	access
365	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-07-31 12:31:54.390411+00	security
366	15	list	decision	\N	Listed decisions	2026-07-31 12:31:55.036803+00	access
367	15	list	decision	\N	Listed decisions	2026-07-31 12:31:58.393464+00	access
368	15	list	decision	\N	Listed decisions	2026-07-31 12:32:01.721781+00	access
369	15	list	decision	\N	Listed decisions	2026-07-31 12:32:04.82366+00	access
370	15	list	decision	\N	Listed decisions	2026-07-31 12:32:38.155044+00	access
371	15	list	decision	\N	Listed decisions	2026-07-31 12:32:41.679359+00	access
372	6	login	user	6	User logged in successfully: admin.test@example.com	2026-07-31 12:33:13.630469+00	security
373	6	list	user	\N	Admin listed all users	2026-07-31 12:33:14.705966+00	access
374	6	list	decision	\N	Listed decisions	2026-07-31 12:33:14.266407+00	access
375	6	list	user	\N	Admin listed all users	2026-07-31 12:33:16.646127+00	access
376	6	list	decision	\N	Listed decisions	2026-07-31 12:33:18.453308+00	access
377	6	list	decision	\N	Listed decisions	2026-07-31 12:33:21.206527+00	access
378	6	list	decision	\N	Listed decisions	2026-07-31 12:33:24.796834+00	access
379	6	delete	decision	47	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:31.084856+00	activity
380	6	delete	decision	46	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:35.49463+00	activity
381	6	delete	decision	45	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:38.199976+00	activity
382	6	delete	decision	44	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:41.944616+00	activity
383	6	delete	decision	43	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:45.17408+00	activity
384	6	delete	decision	42	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:48.569075+00	activity
385	6	delete	decision	48	Deleted decision: Direct File Association in Decision Workspace	2026-07-31 12:33:51.338019+00	activity
386	6	delete	decision	40	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:54.667147+00	activity
387	6	delete	decision	41	Deleted decision: Moving from a monolithic backend to a microservices architecture requires a unified, secure, and performant strategy for user authentication and authorization.	2026-07-31 12:33:57.342056+00	activity
388	6	delete	decision	38	Deleted decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:34:00.769553+00	activity
389	6	delete	decision	39	Deleted decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:34:03.794442+00	activity
390	6	delete	decision	37	Deleted decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:34:06.456149+00	activity
391	6	delete	decision	36	Deleted decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-07-31 12:34:09.340136+00	activity
392	5	login	user	5	User logged in successfully: manager.test@example.com	2026-07-31 12:56:58.728431+00	security
393	5	list	decision	\N	Listed decisions	2026-07-31 12:57:02.402579+00	access
394	5	list	decision	\N	Listed decisions	2026-07-31 12:57:09.898623+00	access
395	5	list	decision	\N	Listed decisions	2026-07-31 12:57:16.533188+00	access
396	5	list	decision	\N	Listed decisions	2026-07-31 12:57:22.968872+00	access
397	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 12:58:08.986361+00	security
398	16	list	decision	\N	Listed decisions	2026-07-31 12:58:09.923067+00	access
399	16	list	decision	\N	Listed decisions	2026-07-31 12:58:11.8715+00	access
400	16	list	decision	\N	Listed decisions	2026-07-31 12:58:13.807475+00	access
401	16	list	decision	\N	Listed decisions	2026-07-31 12:58:15.913939+00	access
402	16	list	decision	\N	Listed decisions	2026-07-31 12:58:51.398831+00	access
403	16	list	decision	\N	Listed decisions	2026-07-31 12:58:53.35732+00	access
404	5	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:05:04.403368+00	access
405	5	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:05:05.832656+00	access
406	5	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-31 13:05:06.607925+00	access
407	5	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-31 13:05:09.227567+00	access
408	5	reject	decision	34	Rejected decision 34 with comment: Please make it proper	2026-07-31 13:05:44.642526+00	activity
409	5	view	decision	34	Viewed decision: Use GitHub for Project Collaboration	2026-07-31 13:05:46.312643+00	access
410	5	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-31 13:05:46.312556+00	access
411	5	list	decision	\N	Listed decisions	2026-07-31 13:05:58.397885+00	access
412	5	list	decision	\N	Listed decisions	2026-07-31 13:06:06.047956+00	access
415	5	list	decision	\N	Listed decisions	2026-07-31 13:06:18.91794+00	access
417	7	list	decision	\N	Listed decisions	2026-07-31 13:06:26.327699+00	access
419	7	list	decision	\N	Listed decisions	2026-07-31 13:06:42.127555+00	access
421	7	list	decision	\N	Listed decisions	2026-07-31 13:06:45.762578+00	access
422	7	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:11:35.522548+00	access
424	7	list	decision	\N	Listed decisions	2026-07-31 13:11:43.716041+00	access
426	7	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:13:04.688077+00	access
430	7	list	decision	\N	Listed decisions	2026-07-31 13:13:13.607615+00	access
432	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-31 13:13:28.42754+00	access
434	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-31 13:13:34.947497+00	access
436	5	list	decision	\N	Listed decisions	2026-07-31 13:13:52.337534+00	access
438	5	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-31 13:14:03.767538+00	access
451	5	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:17:31.11253+00	access
459	7	view_versions	decision	30	Viewed versions for decision 30	2026-07-31 13:18:49.563354+00	access
461	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:19:00.237711+00	access
466	7	list	decision	\N	Listed decisions	2026-07-31 13:19:31.692872+00	access
468	4	list	decision	\N	Listed decisions	2026-07-31 13:19:42.488619+00	access
470	4	list	decision	\N	Listed decisions	2026-07-31 13:19:53.812764+00	access
1244	21	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:12:44.522277+00	access
1248	21	approve	decision	49	Approved decision 49 with comment: 	2026-08-04 13:12:57.168276+00	activity
1250	21	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:13:10.852201+00	access
1252	21	list	decision	\N	Listed decisions	2026-08-04 13:13:24.767785+00	access
1254	21	list	decision	\N	Listed decisions	2026-08-04 13:13:27.607219+00	access
1256	21	list	decision	\N	Listed decisions	2026-08-04 13:13:30.127695+00	access
1663	6	list	decision	\N	Listed decisions	2026-08-14 06:04:59.639019+00	access
1863	7	list	decision	\N	Listed decisions	2026-08-15 16:46:15.636513+00	access
1865	7	list	decision	\N	Listed decisions	2026-08-15 16:47:43.726591+00	access
2026	21	list	decision	\N	Listed decisions	2026-08-16 13:30:37.158863+00	access
2028	21	list	decision	\N	Listed decisions	2026-08-16 13:30:41.253869+00	access
416	7	list	decision	\N	Listed decisions	2026-07-31 13:06:20.472936+00	access
420	7	list	decision	\N	Listed decisions	2026-07-31 13:06:42.92301+00	access
427	7	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:13:06.172982+00	access
429	7	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-31 13:13:08.147916+00	access
431	7	list	decision	\N	Listed decisions	2026-07-31 13:13:20.847861+00	access
433	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-31 13:13:30.058654+00	access
435	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-31 13:13:39.277858+00	access
437	5	list	decision	\N	Listed decisions	2026-07-31 13:13:59.347869+00	access
439	5	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-07-31 13:14:05.688601+00	access
440	5	update_status	decision	31	Updated status of decision 31 from under_review to draft	2026-07-31 13:14:11.827995+00	activity
442	5	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-31 13:14:20.127981+00	access
444	5	list	decision	\N	Listed decisions	2026-07-31 13:15:04.328337+00	access
446	5	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:17:05.203364+00	access
448	5	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:17:10.307854+00	access
458	7	view_versions	decision	30	Viewed versions for decision 30	2026-07-31 13:18:46.863101+00	access
460	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:18:57.143007+00	access
463	7	list	decision	\N	Listed decisions	2026-07-31 13:19:18.3083+00	access
465	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-07-31 13:19:31.383108+00	security
1251	21	list	decision	\N	Listed decisions	2026-08-04 13:13:25.105004+00	access
1319	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:15:38.375212+00	security
1321	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:27:23.80166+00	security
1337	6	list	decision	\N	Listed decisions	2026-08-04 15:14:44.668421+00	access
1338	6	list	decision	\N	Listed decisions	2026-08-04 15:14:52.102842+00	access
1339	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-04 17:09:43.578027+00	security
1345	6	list	decision	\N	Listed decisions	2026-08-04 17:10:23.663837+00	access
1347	6	list	decision	\N	Listed decisions	2026-08-04 17:10:28.164186+00	access
1380	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-05 13:19:23.658068+00	security
1382	16	list	decision	\N	Listed decisions	2026-08-05 13:19:32.671329+00	access
1385	16	list	decision	\N	Listed decisions	2026-08-05 13:19:52.105579+00	access
1394	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-05 18:18:30.316289+00	security
1406	11	list	decision	\N	Listed decisions	2026-08-05 18:27:46.223097+00	access
1408	11	list	decision	\N	Listed decisions	2026-08-05 18:27:57.245537+00	access
1412	11	list	decision	\N	Listed decisions	2026-08-05 18:31:39.104761+00	access
1416	11	list	decision	\N	Listed decisions	2026-08-05 18:32:27.080534+00	access
1418	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-05 18:32:49.293676+00	access
1425	11	list	decision	\N	Listed decisions	2026-08-05 18:33:02.101753+00	access
1431	11	list	decision	\N	Listed decisions	2026-08-05 18:47:30.756735+00	access
1434	11	list	decision	\N	Listed decisions	2026-08-05 18:48:34.442109+00	access
1436	11	list	decision	\N	Listed decisions	2026-08-05 18:48:44.186282+00	access
1446	11	view_versions	decision	55	Viewed versions for decision 55	2026-08-05 18:50:30.599727+00	access
1451	11	list	decision	\N	Listed decisions	2026-08-05 18:50:43.774283+00	access
1499	27	register	user	27	User registered successfully	2026-08-12 16:05:00.693602+00	security
1502	29	register	user	29	User registered successfully	2026-08-12 16:18:29.855781+00	security
1503	29	login	user	29	User logged in successfully	2026-08-12 16:18:31.376156+00	security
1504	29	create	decision	61	Decision created	2026-08-12 16:18:34.181056+00	activity
1509	31	register	user	31	User registered successfully	2026-08-12 16:38:00.899309+00	security
1510	31	login	user	31	User logged in successfully	2026-08-12 16:38:02.45434+00	security
1511	31	create	decision	63	Decision created	2026-08-12 16:38:04.514367+00	activity
1512	31	list	decision	\N	Listed decisions	2026-08-12 16:38:06.260056+00	access
1517	7	login	user	7	User logged in successfully	2026-08-13 05:09:13.541242+00	security
1518	7	create	decision	65	Decision created	2026-08-13 05:09:15.762099+00	activity
1521	7	create	decision	66	Decision created	2026-08-13 05:10:08.557684+00	activity
1524	7	login	user	7	User logged in successfully	2026-08-13 05:28:47.866055+00	security
1525	7	create	decision	67	Decision created	2026-08-13 05:28:50.155525+00	activity
1533	7	login	user	7	User logged in successfully	2026-08-13 05:40:44.15001+00	security
1534	7	create	decision	70	Decision created	2026-08-13 05:40:47.155091+00	activity
1535	7	create	discussion_message	41	Created comment for decision 70	2026-08-13 05:40:48.321782+00	activity
1536	7	create	discussion_message	42	Created meeting note for decision 70	2026-08-13 05:40:49.621226+00	activity
1546	7	create	decision	73	Decision created	2026-08-13 05:45:29.521856+00	activity
1547	7	create	discussion_message	43	Created comment for decision 73	2026-08-13 05:45:31.973379+00	activity
1548	7	create	discussion_message	44	Created meeting note for decision 73	2026-08-13 05:45:34.021198+00	activity
1549	6	login	user	6	User logged in successfully	2026-08-13 06:12:28.089745+00	security
1550	6	list	decision	\N	Listed decisions	2026-08-13 06:12:30.428016+00	access
1556	35	register	user	35	User registered successfully	2026-08-13 06:26:17.502313+00	security
1557	35	login	user	35	User logged in successfully	2026-08-13 06:26:18.147028+00	security
1558	35	create	decision	74	Decision created	2026-08-13 06:26:19.352183+00	activity
1559	35	list	decision	\N	Listed decisions	2026-08-13 06:26:20.471805+00	access
1568	6	login	user	6	User logged in successfully	2026-08-13 07:22:37.073788+00	security
1571	7	login	user	7	User logged in successfully	2026-08-13 07:54:40.98443+00	security
1572	6	login	user	6	User logged in successfully	2026-08-13 07:55:16.640965+00	security
1573	6	login	user	6	User logged in successfully	2026-08-13 08:12:26.158011+00	security
1574	6	login	user	6	User logged in successfully	2026-08-13 13:25:49.10817+00	security
1578	6	list	decision	\N	Listed decisions	2026-08-13 13:26:02.392459+00	access
1579	6	login	user	6	User logged in successfully	2026-08-13 16:45:25.748059+00	security
1584	6	login	user	6	User logged in successfully	2026-08-13 17:37:18.864854+00	security
1593	6	login	user	6	User logged in successfully	2026-08-13 18:27:06.217123+00	security
1595	6	list	decision	\N	Listed decisions	2026-08-13 18:27:09.187352+00	access
418	7	list	decision	\N	Listed decisions	2026-07-31 13:06:33.387495+00	access
423	7	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:11:37.108051+00	access
425	7	list	decision	\N	Listed decisions	2026-07-31 13:11:51.028365+00	access
428	7	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-31 13:13:06.047952+00	access
441	5	view_approvals	decision	31	Viewed approvals for decision 31	2026-07-31 13:14:16.327521+00	access
443	5	list	decision	\N	Listed decisions	2026-07-31 13:14:55.10752+00	access
445	5	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:17:03.643038+00	access
447	5	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:17:07.647531+00	access
449	5	reject	decision	30	Rejected decision 30 with comment: Make it proper	2026-07-31 13:17:28.847978+00	activity
450	5	view	decision	30	Viewed decision: Automated testing	2026-07-31 13:17:31.153507+00	access
452	7	list	decision	\N	Listed decisions	2026-07-31 13:17:50.14249+00	access
453	7	list	decision	\N	Listed decisions	2026-07-31 13:17:58.347573+00	access
454	7	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:18:01.067662+00	access
455	7	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:18:03.06826+00	access
456	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:18:02.692526+00	access
457	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:18:05.842664+00	access
462	7	list	decision	\N	Listed decisions	2026-07-31 13:19:11.25308+00	access
464	7	list	decision	\N	Listed decisions	2026-07-31 13:19:26.408259+00	access
467	4	list	decision	\N	Listed decisions	2026-07-31 13:19:33.417616+00	access
469	4	list	decision	\N	Listed decisions	2026-07-31 13:19:50.693289+00	access
1258	5	list	decision	\N	Listed decisions	2026-08-04 13:13:49.507956+00	access
1260	5	list	decision	\N	Listed decisions	2026-08-04 13:13:50.467652+00	access
1262	5	list	decision	\N	Listed decisions	2026-08-04 13:13:52.467975+00	access
1266	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-04 13:17:17.662415+00	access
1320	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:15:42.052477+00	security
1322	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:30:04.52312+00	security
1340	6	list	decision	\N	Listed decisions	2026-08-04 17:09:49.985274+00	access
1341	6	list	decision	\N	Listed decisions	2026-08-04 17:10:00.254535+00	access
1381	16	list	decision	\N	Listed decisions	2026-08-05 13:19:25.940966+00	access
1383	16	list	decision	\N	Listed decisions	2026-08-05 13:19:37.796802+00	access
1395	11	list	decision	\N	Listed decisions	2026-08-05 18:18:31.744501+00	access
1403	11	list	user	\N	Admin listed all users	2026-08-05 18:27:34.61929+00	access
1405	11	list	decision	\N	Listed decisions	2026-08-05 18:27:40.745347+00	access
1410	11	list	decision	\N	Listed decisions	2026-08-05 18:31:36.117718+00	access
1411	11	list	user	\N	Admin listed all users	2026-08-05 18:31:38.176788+00	access
1413	11	list	decision	\N	Listed decisions	2026-08-05 18:31:41.994117+00	access
1500	28	register	user	28	User registered successfully	2026-08-12 16:09:44.782943+00	security
1501	28	login	user	28	User logged in successfully	2026-08-12 16:09:46.548005+00	security
1505	30	register	user	30	User registered successfully	2026-08-12 16:24:59.528889+00	security
1506	30	login	user	30	User logged in successfully	2026-08-12 16:25:00.158899+00	security
1507	30	create	decision	62	Decision created	2026-08-12 16:25:01.832995+00	activity
1508	30	list	decision	\N	Listed decisions	2026-08-12 16:25:03.253167+00	access
1513	32	register	user	32	User registered successfully	2026-08-12 16:41:50.243137+00	security
1514	32	login	user	32	User logged in successfully	2026-08-12 16:41:51.203172+00	security
1515	32	create	decision	64	Decision created	2026-08-12 16:41:52.713083+00	activity
1516	32	list	decision	\N	Listed decisions	2026-08-12 16:41:55.324008+00	access
1520	7	login	user	7	User logged in successfully	2026-08-13 05:10:07.267965+00	security
1523	6	login	user	6	User logged in successfully	2026-08-13 05:12:01.848493+00	security
1527	7	login	user	7	User logged in successfully	2026-08-13 05:33:04.10018+00	security
1528	7	create	decision	68	Decision created	2026-08-13 05:33:06.14628+00	activity
1531	7	create	decision	69	Decision created	2026-08-13 05:33:43.831514+00	activity
1537	33	register	user	33	User registered successfully	2026-08-13 05:42:33.587528+00	security
1538	33	login	user	33	User logged in successfully	2026-08-13 05:42:34.613049+00	security
1539	33	create	decision	71	Decision created	2026-08-13 05:42:36.559657+00	activity
1540	33	list	decision	\N	Listed decisions	2026-08-13 05:42:37.890625+00	access
1551	6	list	decision	\N	Listed decisions	2026-08-13 06:12:31.188582+00	access
1553	6	list	decision	\N	Listed decisions	2026-08-13 06:12:35.658688+00	access
1560	36	register	user	36	User registered successfully	2026-08-13 06:29:00.769663+00	security
1561	36	login	user	36	User logged in successfully	2026-08-13 06:29:01.268246+00	security
1562	36	create	decision	75	Decision created	2026-08-13 06:29:02.258943+00	activity
1563	36	list	decision	\N	Listed decisions	2026-08-13 06:29:02.902046+00	access
1569	7	login	user	7	User logged in successfully	2026-08-13 07:31:31.826897+00	security
1570	7	login	user	7	User logged in successfully	2026-08-13 07:32:09.070417+00	security
1575	6	list	decision	\N	Listed decisions	2026-08-13 13:25:52.94096+00	access
1580	6	list	decision	\N	Listed decisions	2026-08-13 16:45:34.533185+00	access
1585	6	list	decision	\N	Listed decisions	2026-08-13 17:37:24.369632+00	access
1587	6	list	decision	\N	Listed decisions	2026-08-13 17:37:25.814811+00	access
1594	6	list	decision	\N	Listed decisions	2026-08-13 18:27:10.910978+00	access
1600	11	login	user	11	User logged in successfully	2026-08-13 18:48:18.077319+00	security
1604	11	list	decision	\N	Listed decisions	2026-08-13 18:48:24.288142+00	access
1665	6	login	user	6	User logged in successfully	2026-08-14 06:32:35.117045+00	security
1866	6	login	user	6	User logged in successfully	2026-08-15 16:52:33.839277+00	security
1868	6	list	decision	\N	Listed decisions	2026-08-15 16:52:37.73483+00	access
2029	17	login	user	17	User logged in successfully	2026-08-16 13:38:37.540622+00	security
471	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-07-31 13:20:41.461921+00	security
472	16	list	decision	\N	Listed decisions	2026-07-31 13:20:42.041079+00	access
475	16	list	decision	\N	Listed decisions	2026-07-31 13:20:48.621583+00	access
476	16	list	decision	\N	Listed decisions	2026-07-31 13:20:51.150131+00	access
479	16	list	decision	\N	Listed decisions	2026-07-31 13:20:57.366314+00	access
1261	5	list	decision	\N	Listed decisions	2026-08-04 13:13:51.454265+00	access
1264	5	list	decision	\N	Listed decisions	2026-08-04 13:17:08.054254+00	access
1269	5	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-04 13:17:20.689611+00	access
1323	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:32:08.263878+00	security
1342	6	list	decision	\N	Listed decisions	2026-08-04 17:10:21.812584+00	access
1348	6	list	user	\N	Admin listed all users	2026-08-04 17:15:47.707597+00	access
1384	16	list	decision	\N	Listed decisions	2026-08-05 13:19:45.871117+00	access
1396	11	list	user	\N	Admin listed all users	2026-08-05 18:18:32.330362+00	access
1398	11	list	decision	\N	Listed decisions	2026-08-05 18:18:34.616962+00	access
1400	11	list	decision	\N	Listed decisions	2026-08-05 18:18:40.751498+00	access
1402	11	list	decision	\N	Listed decisions	2026-08-05 18:19:00.439689+00	access
1407	11	list	decision	\N	Listed decisions	2026-08-05 18:27:53.146116+00	access
1419	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-05 18:32:52.89776+00	access
1421	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-05 18:32:56.918877+00	access
1426	11	list	decision	\N	Listed decisions	2026-08-05 18:33:04.978494+00	access
1432	11	list	decision	\N	Listed decisions	2026-08-05 18:47:33.780143+00	access
1435	11	list	decision	\N	Listed decisions	2026-08-05 18:48:37.438332+00	access
1440	11	list	decision	\N	Listed decisions	2026-08-05 18:50:04.603161+00	access
1447	11	view_versions	decision	55	Viewed versions for decision 55	2026-08-05 18:50:31.11238+00	access
1530	7	login	user	7	User logged in successfully	2026-08-13 05:33:42.124197+00	security
1541	34	register	user	34	User registered successfully	2026-08-13 05:45:12.47551+00	security
1542	34	login	user	34	User logged in successfully	2026-08-13 05:45:13.116908+00	security
1543	34	create	decision	72	Decision created	2026-08-13 05:45:14.344946+00	activity
1544	34	list	decision	\N	Listed decisions	2026-08-13 05:45:15.145627+00	access
1552	6	list	decision	\N	Listed decisions	2026-08-13 06:12:30.764379+00	access
1564	7	login	user	7	User logged in successfully	2026-08-13 06:29:07.21445+00	security
1565	7	create	decision	76	Decision created	2026-08-13 06:29:08.513672+00	activity
1566	7	create	discussion_message	45	Created comment for decision 76	2026-08-13 06:29:09.114289+00	activity
1567	7	create	discussion_message	46	Created meeting note for decision 76	2026-08-13 06:29:09.816969+00	activity
1576	6	list	decision	\N	Listed decisions	2026-08-13 13:25:51.599866+00	access
1581	6	list	decision	\N	Listed decisions	2026-08-13 16:45:31.478677+00	access
1586	6	list	decision	\N	Listed decisions	2026-08-13 17:37:22.233883+00	access
1590	6	list	decision	\N	Listed decisions	2026-08-13 17:37:30.199044+00	access
1596	6	list	decision	\N	Listed decisions	2026-08-13 18:27:13.168345+00	access
1601	11	list	decision	\N	Listed decisions	2026-08-13 18:48:20.005167+00	access
1666	6	list	decision	\N	Listed decisions	2026-08-14 06:32:36.742762+00	access
1667	6	list	decision	\N	Listed decisions	2026-08-14 06:32:37.342739+00	access
1867	6	list	decision	\N	Listed decisions	2026-08-15 16:52:36.215506+00	access
1870	6	list	decision	\N	Listed decisions	2026-08-15 16:52:51.644748+00	access
2030	17	list	decision	\N	Listed decisions	2026-08-16 13:38:42.153989+00	access
2032	17	list	decision	\N	Listed decisions	2026-08-16 13:38:45.514196+00	access
473	16	list	decision	\N	Listed decisions	2026-07-31 13:20:44.081999+00	access
478	16	list	decision	\N	Listed decisions	2026-07-31 13:20:55.388224+00	access
481	16	list	decision	\N	Listed decisions	2026-07-31 13:21:01.572416+00	access
1270	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:19:22.609429+00	security
1273	5	list	decision	\N	Listed decisions	2026-08-04 13:19:28.773859+00	access
1324	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 14:32:48.734742+00	security
1325	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-04 14:33:04.494833+00	security
1343	6	list	decision	\N	Listed decisions	2026-08-04 17:10:21.140205+00	access
1350	6	list	decision	\N	Listed decisions	2026-08-04 17:15:57.76023+00	access
1386	16	list	decision	\N	Listed decisions	2026-08-05 13:19:52.203145+00	access
1397	11	list	user	\N	Admin listed all users	2026-08-05 18:18:34.122292+00	access
1399	11	list	decision	\N	Listed decisions	2026-08-05 18:18:37.520214+00	access
1401	11	list	decision	\N	Listed decisions	2026-08-05 18:18:57.565209+00	access
1404	11	list	decision	\N	Listed decisions	2026-08-05 18:27:34.187804+00	access
1414	11	list	decision	\N	Listed decisions	2026-08-05 18:31:44.825063+00	access
1420	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-05 18:32:53.407813+00	access
1422	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-05 18:32:57.433786+00	access
1427	11	list	decision	\N	Listed decisions	2026-08-05 18:33:07.851035+00	access
1439	11	list	decision	\N	Listed decisions	2026-08-05 18:48:53.360339+00	access
1442	11	list	decision	\N	Listed decisions	2026-08-05 18:50:14.146817+00	access
1444	11	view_discussion	decision	55	Viewed discussion thread for decision 55	2026-08-05 18:50:27.421351+00	access
1449	11	view_approvals	decision	55	Viewed approvals for decision 55	2026-08-05 18:50:32.99481+00	access
1545	7	login	user	7	User logged in successfully	2026-08-13 05:45:26.558633+00	security
1554	6	list	decision	\N	Listed decisions	2026-08-13 06:12:43.231739+00	access
1577	6	list	decision	\N	Listed decisions	2026-08-13 13:25:54.479673+00	access
1582	6	list	decision	\N	Listed decisions	2026-08-13 16:45:37.087824+00	access
1588	6	list	decision	\N	Listed decisions	2026-08-13 17:37:30.524595+00	access
1589	6	list	decision	\N	Listed decisions	2026-08-13 17:37:31.598927+00	access
1597	6	list	decision	\N	Listed decisions	2026-08-13 18:27:22.686916+00	access
1602	11	list	decision	\N	Listed decisions	2026-08-13 18:48:19.427194+00	access
1668	6	list	decision	\N	Listed decisions	2026-08-14 06:32:36.631463+00	access
1869	6	list	decision	\N	Listed decisions	2026-08-15 16:52:35.934423+00	access
2031	17	list	decision	\N	Listed decisions	2026-08-16 13:38:43.523325+00	access
474	16	list	decision	\N	Listed decisions	2026-07-31 13:20:46.535357+00	access
477	16	list	decision	\N	Listed decisions	2026-07-31 13:20:53.337185+00	access
480	16	list	decision	\N	Listed decisions	2026-07-31 13:20:59.558668+00	access
482	16	list	decision	\N	Listed decisions	2026-07-31 13:21:28.254394+00	access
483	16	list	decision	\N	Listed decisions	2026-07-31 13:21:30.740255+00	access
484	16	list	decision	\N	Listed decisions	2026-07-31 13:21:32.87022+00	access
485	16	list	decision	\N	Listed decisions	2026-07-31 13:21:34.907882+00	access
486	7	view_versions	decision	30	Viewed versions for decision 30	2026-07-31 13:22:03.047602+00	access
487	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:22:04.672771+00	access
488	7	view_versions	decision	30	Viewed versions for decision 30	2026-07-31 13:22:05.648155+00	access
489	7	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:22:07.708196+00	access
490	7	list	decision	\N	Listed decisions	2026-07-31 13:22:14.322699+00	access
491	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:22:21.512971+00	access
492	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:22:23.002587+00	access
493	7	list	decision	\N	Listed decisions	2026-07-31 13:22:21.93341+00	access
494	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-31 13:22:28.972559+00	access
495	4	view_approvals	decision	34	Viewed approvals for decision 34	2026-07-31 13:22:31.612767+00	access
496	4	list	decision	\N	Listed decisions	2026-07-31 13:26:19.328499+00	access
497	4	list	decision	\N	Listed decisions	2026-07-31 13:26:25.552501+00	access
498	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:26:52.082503+00	access
499	4	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-07-31 13:26:53.288045+00	access
500	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-07-31 13:29:35.602479+00	security
501	16	list	decision	\N	Listed decisions	2026-07-31 13:31:11.636739+00	access
502	16	list	decision	\N	Listed decisions	2026-07-31 13:31:13.584037+00	access
503	16	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 13:31:22.114701+00	access
504	16	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-07-31 13:31:22.523444+00	access
505	16	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 13:31:24.968891+00	access
506	16	view_versions	decision	35	Viewed versions for decision 35	2026-07-31 13:31:25.376828+00	access
507	16	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 13:31:26.088266+00	access
508	16	view_approvals	decision	35	Viewed approvals for decision 35	2026-07-31 13:31:26.49482+00	access
509	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 13:31:27.224457+00	access
510	16	list_alternatives	decision	35	Viewed alternatives list for decision 35	2026-07-31 13:31:27.635138+00	access
511	16	list	decision	\N	Listed decisions	2026-07-31 13:31:28.925947+00	access
512	16	list	decision	\N	Listed decisions	2026-07-31 13:31:31.488374+00	access
513	16	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:31:37.412001+00	access
514	16	view_discussion	decision	33	Viewed discussion thread for decision 33	2026-07-31 13:31:37.842048+00	access
515	16	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-31 13:31:38.90437+00	access
516	16	view_approvals	decision	33	Viewed approvals for decision 33	2026-07-31 13:31:39.517329+00	access
517	16	view_versions	decision	33	Viewed versions for decision 33	2026-07-31 13:31:41.210907+00	access
518	16	view_versions	decision	33	Viewed versions for decision 33	2026-07-31 13:31:41.625142+00	access
519	16	list_alternatives	decision	33	Viewed alternatives list for decision 33	2026-07-31 13:31:44.519748+00	access
520	16	list_alternatives	decision	33	Viewed alternatives list for decision 33	2026-07-31 13:31:44.943874+00	access
521	16	list	decision	\N	Listed decisions	2026-07-31 13:31:45.663702+00	access
522	16	list	decision	\N	Listed decisions	2026-07-31 13:31:47.657532+00	access
523	5	update_status	decision	30	Updated status of decision 30 from rejected to under_review	2026-07-31 13:32:00.108103+00	activity
524	7	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:32:14.932549+00	access
525	7	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:32:15.949248+00	access
526	4	list	decision	\N	Listed decisions	2026-07-31 13:32:27.127561+00	access
527	4	list	decision	\N	Listed decisions	2026-07-31 13:32:31.387531+00	access
528	4	list	decision	\N	Listed decisions	2026-07-31 13:32:35.277358+00	access
529	4	list	decision	\N	Listed decisions	2026-07-31 13:32:41.34762+00	access
530	4	list	decision	\N	Listed decisions	2026-07-31 13:32:46.208484+00	access
531	4	list	decision	\N	Listed decisions	2026-07-31 13:32:53.028647+00	access
532	4	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:33:02.196601+00	access
533	4	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-07-31 13:33:03.068+00	access
534	4	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:33:05.533234+00	access
535	4	view_approvals	decision	30	Viewed approvals for decision 30	2026-07-31 13:33:06.952912+00	access
536	4	list	decision	\N	Listed decisions	2026-07-31 13:33:25.162636+00	access
537	4	list	decision	\N	Listed decisions	2026-07-31 13:33:29.142534+00	access
538	4	list	decision	\N	Listed decisions	2026-07-31 13:36:31.547682+00	access
539	4	list	decision	\N	Listed decisions	2026-07-31 13:36:35.208118+00	access
540	7	login	user	7	User logged in successfully: employee.test@example.com	2026-07-31 13:36:55.908064+00	security
541	7	list	decision	\N	Listed decisions	2026-07-31 13:36:57.253501+00	access
542	7	list	decision	\N	Listed decisions	2026-07-31 13:37:00.728233+00	access
543	7	list	decision	\N	Listed decisions	2026-07-31 13:37:04.627922+00	access
544	7	list	decision	\N	Listed decisions	2026-07-31 13:37:08.068077+00	access
545	5	list	decision	\N	Listed decisions	2026-07-31 13:37:13.029491+00	access
546	5	list	decision	\N	Listed decisions	2026-07-31 13:37:19.627643+00	access
547	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-07-31 13:51:06.702828+00	security
548	11	list	decision	\N	Listed decisions	2026-07-31 13:51:08.449949+00	access
549	11	list	user	\N	Admin listed all users	2026-07-31 13:51:09.253883+00	access
550	11	list	user	\N	Admin listed all users	2026-07-31 13:51:11.516144+00	access
551	11	list	decision	\N	Listed decisions	2026-07-31 13:51:11.639047+00	access
552	11	list	decision	\N	Listed decisions	2026-07-31 13:51:14.755127+00	access
553	11	list	decision	\N	Listed decisions	2026-07-31 13:51:18.485749+00	access
554	11	list	user	\N	Admin listed all users	2026-07-31 13:57:34.252693+00	access
555	11	list	decision	\N	Listed decisions	2026-07-31 13:57:34.056152+00	access
556	11	list	user	\N	Admin listed all users	2026-07-31 13:57:35.868296+00	access
557	11	list	decision	\N	Listed decisions	2026-07-31 13:57:36.488026+00	access
558	11	list	decision	\N	Listed decisions	2026-07-31 13:57:38.988857+00	access
565	11	list	decision	\N	Listed decisions	2026-07-31 13:57:48.136742+00	access
567	11	list	decision	\N	Listed decisions	2026-07-31 13:57:50.917014+00	access
1271	5	list	decision	\N	Listed decisions	2026-08-04 13:19:23.7302+00	access
1276	5	list	decision	\N	Listed decisions	2026-08-04 13:19:40.925595+00	access
1326	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-04 14:39:14.193821+00	security
1327	6	list	decision	\N	Listed decisions	2026-08-04 14:43:27.278797+00	access
1334	6	list	decision	\N	Listed decisions	2026-08-04 14:43:43.168882+00	access
1344	6	list	user	\N	Admin listed all users	2026-08-04 17:10:22.868511+00	access
1346	6	list	decision	\N	Listed decisions	2026-08-04 17:10:25.978588+00	access
1349	6	list	decision	\N	Listed decisions	2026-08-04 17:15:47.308954+00	access
1351	6	list	decision	\N	Listed decisions	2026-08-04 17:16:07.73366+00	access
1369	6	list	user	\N	Admin listed all users	2026-08-04 17:19:59.618416+00	access
1387	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-05 13:27:09.472037+00	security
1409	11	list	user	\N	Admin listed all users	2026-08-05 18:31:36.322475+00	access
1415	11	list	decision	\N	Listed decisions	2026-08-05 18:32:24.221052+00	access
1417	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-05 18:32:48.778767+00	access
1424	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-05 18:32:59.37582+00	access
1430	11	list	decision	\N	Listed decisions	2026-08-05 18:47:27.944018+00	access
1433	11	create	decision	55	Created decision: test decision 2	2026-08-05 18:48:27.546078+00	activity
1438	11	list	decision	\N	Listed decisions	2026-08-05 18:48:50.397908+00	access
1441	11	list	decision	\N	Listed decisions	2026-08-05 18:50:08.743866+00	access
1448	11	view_approvals	decision	55	Viewed approvals for decision 55	2026-08-05 18:50:32.468049+00	access
1555	6	list	decision	\N	Listed decisions	2026-08-13 06:12:50.602018+00	access
1583	6	list	decision	\N	Listed decisions	2026-08-13 16:45:50.200262+00	access
1591	6	list	decision	\N	Listed decisions	2026-08-13 17:37:37.656178+00	access
1598	6	list	decision	\N	Listed decisions	2026-08-13 18:40:28.480056+00	access
1603	11	list	decision	\N	Listed decisions	2026-08-13 18:48:20.623048+00	access
1606	11	list	decision	\N	Listed decisions	2026-08-13 18:48:47.808396+00	access
1669	6	list	decision	\N	Listed decisions	2026-08-14 06:32:41.436614+00	access
1871	6	list	decision	\N	Listed decisions	2026-08-15 17:30:12.382495+00	access
1873	6	list	decision	\N	Listed decisions	2026-08-15 17:30:14.00786+00	access
2033	17	list	decision	\N	Listed decisions	2026-08-16 13:38:47.887344+00	access
559	11	list	decision	\N	Listed decisions	2026-07-31 13:57:41.420251+00	access
1272	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:19:29.593166+00	security
1275	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:19:39.106607+00	security
1277	5	list	decision	\N	Listed decisions	2026-08-04 13:19:47.107927+00	access
1328	6	list	decision	\N	Listed decisions	2026-08-04 14:43:33.489256+00	access
1330	6	list	decision	\N	Listed decisions	2026-08-04 14:43:38.758746+00	access
1332	6	list	user	\N	Admin listed all users	2026-08-04 14:43:41.710395+00	access
1352	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-04 17:17:58.483667+00	security
1353	11	list	user	\N	Admin listed all users	2026-08-04 17:18:00.575804+00	access
1364	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 17:19:26.407173+00	access
1388	11	list	user	\N	Admin listed all users	2026-08-05 13:27:11.491271+00	access
1390	11	list	user	\N	Admin listed all users	2026-08-05 13:27:13.234941+00	access
1392	11	list	decision	\N	Listed decisions	2026-08-05 13:27:18.096733+00	access
1423	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-05 18:32:58.879449+00	access
1428	11	list	decision	\N	Listed decisions	2026-08-05 18:33:11.523625+00	access
1429	11	list	decision	\N	Listed decisions	2026-08-05 18:47:25.062431+00	access
1437	11	list	decision	\N	Listed decisions	2026-08-05 18:48:47.196163+00	access
1443	11	list	decision	\N	Listed decisions	2026-08-05 18:50:20.793184+00	access
1445	11	view_discussion	decision	55	Viewed discussion thread for decision 55	2026-08-05 18:50:27.911129+00	access
1450	11	list	decision	\N	Listed decisions	2026-08-05 18:50:40.789258+00	access
1592	7	login	user	7	User logged in successfully	2026-08-13 17:43:59.888841+00	security
1599	6	list	decision	\N	Listed decisions	2026-08-13 18:40:25.831493+00	access
1605	11	list	decision	\N	Listed decisions	2026-08-13 18:48:42.226778+00	access
1872	6	list	decision	\N	Listed decisions	2026-08-15 17:30:11.441824+00	access
2034	17	create	decision	79	Decision created	2026-08-16 13:42:42.467764+00	activity
560	11	list	decision	\N	Listed decisions	2026-07-31 13:57:43.160655+00	access
561	11	list	user	\N	Admin listed all users	2026-07-31 13:57:43.691387+00	access
563	11	list	decision	\N	Listed decisions	2026-07-31 13:57:45.758328+00	access
564	11	list	user	\N	Admin listed all users	2026-07-31 13:57:48.28841+00	access
566	11	list	user	\N	Admin listed all users	2026-07-31 13:57:50.085666+00	access
1274	5	list	decision	\N	Listed decisions	2026-08-04 13:19:34.359971+00	access
1279	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:20:42.760076+00	security
1329	6	list	user	\N	Admin listed all users	2026-08-04 14:43:33.499419+00	access
1333	6	list	decision	\N	Listed decisions	2026-08-04 14:43:42.178689+00	access
1354	11	list	decision	\N	Listed decisions	2026-08-04 17:18:00.759297+00	access
1358	11	list	decision	\N	Listed decisions	2026-08-04 17:18:09.183259+00	access
1359	11	list	decision	\N	Listed decisions	2026-08-04 17:19:17.441072+00	access
1361	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-04 17:19:23.506653+00	access
1366	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:19:27.414762+00	access
1371	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:20:02.44562+00	access
1389	11	list	decision	\N	Listed decisions	2026-08-05 13:27:11.236402+00	access
1391	11	list	decision	\N	Listed decisions	2026-08-05 13:27:14.290349+00	access
1452	11	list	decision	\N	Listed decisions	2026-08-05 18:51:19.408363+00	access
1457	11	list	decision	\N	Listed decisions	2026-08-05 18:52:26.058962+00	access
1459	11	list	decision	\N	Listed decisions	2026-08-05 18:52:42.086954+00	access
1461	11	list	decision	\N	Listed decisions	2026-08-05 18:59:51.982093+00	access
1467	11	list	decision	\N	Listed decisions	2026-08-05 19:04:15.109676+00	access
1469	11	list	decision	\N	Listed decisions	2026-08-05 19:04:21.039187+00	access
1471	11	list	decision	\N	Listed decisions	2026-08-05 19:06:43.327381+00	access
1475	11	list	decision	\N	Listed decisions	2026-08-05 19:08:28.560405+00	access
1483	11	list	decision	\N	Listed decisions	2026-08-05 19:12:40.787556+00	access
1488	11	list	decision	\N	Listed decisions	2026-08-05 19:20:33.876862+00	access
1607	11	list	decision	\N	Listed decisions	2026-08-13 18:49:27.507282+00	access
1874	6	list	decision	\N	Listed decisions	2026-08-15 17:30:24.512558+00	access
2035	17	list	decision	\N	Listed decisions	2026-08-16 13:42:46.559238+00	access
562	11	list	user	\N	Admin listed all users	2026-07-31 13:57:45.43075+00	access
568	11	list	decision	\N	Listed decisions	2026-07-31 13:58:28.499628+00	access
569	11	list	user	\N	Admin listed all users	2026-07-31 13:58:29.072814+00	access
570	11	list	user	\N	Admin listed all users	2026-07-31 13:58:30.703806+00	access
571	11	list	decision	\N	Listed decisions	2026-07-31 13:58:30.970934+00	access
572	11	list	decision	\N	Listed decisions	2026-07-31 13:58:33.493573+00	access
573	11	list	decision	\N	Listed decisions	2026-07-31 13:58:36.211048+00	access
574	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-07-31 13:58:49.852794+00	security
575	11	list	decision	\N	Listed decisions	2026-07-31 13:58:50.892505+00	access
576	11	list	user	\N	Admin listed all users	2026-07-31 13:58:51.593334+00	access
577	11	list	user	\N	Admin listed all users	2026-07-31 13:58:53.331795+00	access
578	11	list	decision	\N	Listed decisions	2026-07-31 13:58:53.608194+00	access
579	11	list	decision	\N	Listed decisions	2026-07-31 13:58:56.612359+00	access
580	11	list	decision	\N	Listed decisions	2026-07-31 13:58:59.853178+00	access
581	11	list	decision	\N	Listed decisions	2026-07-31 14:00:26.32954+00	access
582	11	list	decision	\N	Listed decisions	2026-07-31 14:00:28.907301+00	access
583	11	list	decision	\N	Listed decisions	2026-07-31 14:03:41.578026+00	access
584	11	list	user	\N	Admin listed all users	2026-07-31 14:03:42.59331+00	access
585	11	list	user	\N	Admin listed all users	2026-07-31 14:03:44.327504+00	access
586	11	list	decision	\N	Listed decisions	2026-07-31 14:03:44.242312+00	access
587	11	list	decision	\N	Listed decisions	2026-07-31 14:03:47.307698+00	access
588	11	list	decision	\N	Listed decisions	2026-07-31 14:03:50.160251+00	access
589	11	list	decision	\N	Listed decisions	2026-07-31 14:04:43.565349+00	access
590	11	list	decision	\N	Listed decisions	2026-07-31 14:04:46.363716+00	access
591	11	list	decision	\N	Listed decisions	2026-07-31 14:04:48.925868+00	access
592	11	list	decision	\N	Listed decisions	2026-07-31 14:04:51.444283+00	access
593	11	list	user	\N	Admin listed all users	2026-07-31 14:04:56.699888+00	access
594	11	list	decision	\N	Listed decisions	2026-07-31 14:04:56.544969+00	access
595	11	list	user	\N	Admin listed all users	2026-07-31 14:04:58.668139+00	access
596	11	list	decision	\N	Listed decisions	2026-07-31 14:04:59.347137+00	access
597	11	list	decision	\N	Listed decisions	2026-07-31 14:05:02.006288+00	access
598	11	list	decision	\N	Listed decisions	2026-07-31 14:05:04.656843+00	access
599	11	list	user	\N	Admin listed all users	2026-07-31 14:05:26.498515+00	access
600	11	list	decision	\N	Listed decisions	2026-07-31 14:05:26.337921+00	access
601	11	list	user	\N	Admin listed all users	2026-07-31 14:05:28.237921+00	access
602	11	list	decision	\N	Listed decisions	2026-07-31 14:05:28.918824+00	access
603	11	list	decision	\N	Listed decisions	2026-07-31 14:05:31.791064+00	access
604	11	list	decision	\N	Listed decisions	2026-07-31 14:05:34.568219+00	access
605	16	list	decision	\N	Listed decisions	2026-07-31 14:05:58.278123+00	access
606	16	list	decision	\N	Listed decisions	2026-07-31 14:06:00.303363+00	access
607	16	list	decision	\N	Listed decisions	2026-07-31 14:06:02.298869+00	access
608	16	list	decision	\N	Listed decisions	2026-07-31 14:06:04.372629+00	access
609	16	create	decision	49	Created decision: text	2026-07-31 14:06:14.721896+00	activity
610	16	list	decision	\N	Listed decisions	2026-07-31 14:06:15.147857+00	access
611	16	list	decision	\N	Listed decisions	2026-07-31 14:06:17.252496+00	access
612	11	list	user	\N	Admin listed all users	2026-07-31 14:06:28.098698+00	access
613	11	list	decision	\N	Listed decisions	2026-07-31 14:06:27.955683+00	access
614	11	list	user	\N	Admin listed all users	2026-07-31 14:06:29.86746+00	access
615	11	list	decision	\N	Listed decisions	2026-07-31 14:06:30.497582+00	access
616	11	list	decision	\N	Listed decisions	2026-07-31 14:06:33.167553+00	access
617	11	list	decision	\N	Listed decisions	2026-07-31 14:06:35.79758+00	access
618	11	list	decision	\N	Listed decisions	2026-07-31 14:06:38.494691+00	access
619	11	list	decision	\N	Listed decisions	2026-07-31 14:06:41.215881+00	access
620	11	list	decision	\N	Listed decisions	2026-07-31 14:06:43.786025+00	access
621	11	list	decision	\N	Listed decisions	2026-07-31 14:06:46.554005+00	access
622	11	list	decision	\N	Listed decisions	2026-07-31 14:06:56.288942+00	access
623	11	list	decision	\N	Listed decisions	2026-07-31 14:06:59.092331+00	access
624	11	list	decision	\N	Listed decisions	2026-07-31 14:07:09.965882+00	access
625	11	list	decision	\N	Listed decisions	2026-07-31 14:07:12.610583+00	access
626	11	list	decision	\N	Listed decisions	2026-07-31 14:07:15.234287+00	access
627	11	list	decision	\N	Listed decisions	2026-07-31 14:07:17.830124+00	access
628	17	login	user	17	User logged in successfully: kulsum@gmail.com	2026-07-31 15:50:07.989496+00	security
629	17	list	decision	\N	Listed decisions	2026-07-31 15:50:10.788327+00	access
630	17	list	decision	\N	Listed decisions	2026-07-31 15:50:19.972988+00	access
631	17	list	decision	\N	Listed decisions	2026-07-31 15:50:31.812792+00	access
632	17	list	decision	\N	Listed decisions	2026-07-31 15:50:31.811257+00	access
633	17	list	decision	\N	Listed decisions	2026-07-31 15:50:44.956998+00	access
634	17	list	decision	\N	Listed decisions	2026-07-31 15:50:44.97033+00	access
635	17	list	decision	\N	Listed decisions	2026-07-31 15:51:26.353029+00	access
636	17	list	decision	\N	Listed decisions	2026-07-31 15:51:33.958963+00	access
637	17	list	decision	\N	Listed decisions	2026-07-31 15:51:43.014189+00	access
638	17	list	decision	\N	Listed decisions	2026-07-31 15:51:47.400292+00	access
639	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 11:38:38.321142+00	security
640	16	list	decision	\N	Listed decisions	2026-08-01 11:38:39.506272+00	access
641	16	list	decision	\N	Listed decisions	2026-08-01 11:38:42.094861+00	access
642	16	list	decision	\N	Listed decisions	2026-08-01 11:38:45.200888+00	access
643	16	list	decision	\N	Listed decisions	2026-08-01 11:38:47.994545+00	access
644	16	list	decision	\N	Listed decisions	2026-08-01 11:38:51.471157+00	access
645	16	list	decision	\N	Listed decisions	2026-08-01 11:38:53.924482+00	access
646	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-08-01 11:39:26.381727+00	security
647	15	list	decision	\N	Listed decisions	2026-08-01 11:39:27.991565+00	access
648	15	list	decision	\N	Listed decisions	2026-08-01 11:39:34.704485+00	access
649	15	list	decision	\N	Listed decisions	2026-08-01 11:39:41.211781+00	access
650	15	list	decision	\N	Listed decisions	2026-08-01 11:39:48.265081+00	access
651	15	create	decision	50	Created decision: texting	2026-08-01 11:39:50.925358+00	activity
652	15	list	decision	\N	Listed decisions	2026-08-01 11:39:53.537628+00	access
653	15	list	decision	\N	Listed decisions	2026-08-01 11:40:01.629124+00	access
654	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 11:40:13.530759+00	security
655	16	list	decision	\N	Listed decisions	2026-08-01 11:40:14.452886+00	access
656	16	list	decision	\N	Listed decisions	2026-08-01 11:40:19.71603+00	access
657	16	list	decision	\N	Listed decisions	2026-08-01 11:40:23.527818+00	access
658	16	list	decision	\N	Listed decisions	2026-08-01 11:40:26.166471+00	access
659	16	list	decision	\N	Listed decisions	2026-08-01 11:40:35.392214+00	access
663	16	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 11:40:44.176956+00	access
666	16	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 11:40:46.490992+00	access
671	16	list	decision	\N	Listed decisions	2026-08-01 11:40:58.29866+00	access
1278	5	list	decision	\N	Listed decisions	2026-08-04 13:19:54.134168+00	access
1331	6	list	decision	\N	Listed decisions	2026-08-04 14:43:40.324994+00	access
1355	11	list	user	\N	Admin listed all users	2026-08-04 17:18:02.30854+00	access
1357	11	list	decision	\N	Listed decisions	2026-08-04 17:18:06.331411+00	access
1360	11	list	decision	\N	Listed decisions	2026-08-04 17:19:20.295203+00	access
1365	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:19:26.887643+00	access
1370	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:20:01.938089+00	access
1393	11	list	decision	\N	Listed decisions	2026-08-05 13:27:20.851872+00	access
1453	11	list	decision	\N	Listed decisions	2026-08-05 18:51:22.363062+00	access
1463	11	list	decision	\N	Listed decisions	2026-08-05 19:03:04.430958+00	access
1479	11	list	decision	\N	Listed decisions	2026-08-05 19:09:28.111445+00	access
1481	11	list	decision	\N	Listed decisions	2026-08-05 19:11:01.458332+00	access
1490	11	list	decision	\N	Listed decisions	2026-08-05 19:20:41.217317+00	access
1496	11	list	decision	\N	Listed decisions	2026-08-05 19:24:28.902501+00	access
1608	11	list	decision	\N	Listed decisions	2026-08-13 18:49:28.130232+00	access
2036	17	list	decision	\N	Listed decisions	2026-08-16 13:42:46.559432+00	access
660	16	list	decision	\N	Listed decisions	2026-08-01 11:40:38.098296+00	access
664	16	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 11:40:44.703801+00	access
668	16	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 11:40:47.256303+00	access
669	16	list	decision	\N	Listed decisions	2026-08-01 11:40:53.264847+00	access
672	16	list	decision	\N	Listed decisions	2026-08-01 11:41:00.995321+00	access
1280	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:21:49.001427+00	security
1281	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-04 13:22:45.241647+00	security
1285	5	list	decision	\N	Listed decisions	2026-08-04 13:22:49.336715+00	access
1293	21	list	decision	\N	Listed decisions	2026-08-04 13:23:14.126733+00	access
1295	21	list	decision	\N	Listed decisions	2026-08-04 13:23:16.926523+00	access
1310	7	list	decision	\N	Listed decisions	2026-08-04 13:23:45.457104+00	access
1318	4	list	decision	\N	Listed decisions	2026-08-04 14:08:25.364273+00	access
1335	6	list	decision	\N	Listed decisions	2026-08-04 14:44:17.000357+00	access
1356	11	list	decision	\N	Listed decisions	2026-08-04 17:18:03.55338+00	access
1362	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-04 17:19:24.067102+00	access
1367	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 17:19:29.218706+00	access
1372	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:20:07.741594+00	access
1454	11	list	decision	\N	Listed decisions	2026-08-05 18:51:25.607905+00	access
1464	11	list	decision	\N	Listed decisions	2026-08-05 19:03:09.171576+00	access
1474	11	list	decision	\N	Listed decisions	2026-08-05 19:08:22.606308+00	access
1480	11	list	decision	\N	Listed decisions	2026-08-05 19:09:31.007642+00	access
1482	11	list	decision	\N	Listed decisions	2026-08-05 19:11:04.297504+00	access
1485	11	list	decision	\N	Listed decisions	2026-08-05 19:17:23.937472+00	access
1487	11	list	decision	\N	Listed decisions	2026-08-05 19:20:31.024584+00	access
1494	11	list	decision	\N	Listed decisions	2026-08-05 19:24:20.618758+00	access
1497	11	list	decision	\N	Listed decisions	2026-08-05 19:29:30.050124+00	access
1609	37	register	user	37	User registered successfully	2026-08-13 19:40:24.221192+00	security
1610	37	login	user	37	User logged in successfully	2026-08-13 19:40:25.303653+00	security
1611	37	create	decision	77	Decision created	2026-08-13 19:40:26.663973+00	activity
1612	37	list	decision	\N	Listed decisions	2026-08-13 19:40:28.121938+00	access
1619	6	login	user	6	User logged in successfully	2026-08-14 04:23:50.01874+00	security
1635	7	login	user	7	User logged in successfully	2026-08-14 05:24:08.313707+00	security
1636	6	login	user	6	User logged in successfully	2026-08-14 05:25:16.148367+00	security
1670	6	login	user	6	User logged in successfully	2026-08-14 07:37:54.342429+00	security
1671	6	list	decision	\N	Listed decisions	2026-08-14 07:37:55.645262+00	access
1675	7	login	user	7	User logged in successfully	2026-08-14 08:20:30.245624+00	security
1677	6	login	user	6	User logged in successfully	2026-08-14 09:18:45.232977+00	security
1679	6	list	decision	\N	Listed decisions	2026-08-14 09:18:55.272605+00	access
1684	6	list	decision	\N	Listed decisions	2026-08-14 09:20:56.407749+00	access
1688	6	list	decision	\N	Listed decisions	2026-08-14 09:22:03.895516+00	access
1690	6	list	decision	\N	Listed decisions	2026-08-14 09:22:24.993461+00	access
1696	11	login	user	11	User logged in successfully	2026-08-14 12:15:22.76767+00	security
1725	6	login	user	6	User logged in successfully	2026-08-14 15:56:31.778282+00	security
1730	6	list	decision	\N	Listed decisions	2026-08-14 15:58:09.538742+00	access
1732	6	list	decision	\N	Listed decisions	2026-08-14 15:58:23.453369+00	access
1754	6	login	user	6	User logged in successfully	2026-08-14 17:42:35.260837+00	security
1757	6	list	decision	\N	Listed decisions	2026-08-14 17:42:39.336325+00	access
1763	6	list	decision	\N	Listed decisions	2026-08-14 17:49:22.942455+00	access
1769	7	login	user	7	User logged in successfully	2026-08-15 09:43:20.721235+00	security
1770	7	login	user	7	User logged in successfully	2026-08-15 10:11:26.239939+00	security
1771	5	login	user	5	User logged in successfully	2026-08-15 10:12:21.814841+00	security
1773	7	login	user	7	User logged in successfully	2026-08-15 10:35:47.347169+00	security
1811	5	login	user	5	User logged in successfully	2026-08-15 13:14:01.393377+00	security
1815	5	list	decision	\N	Listed decisions	2026-08-15 13:14:23.412692+00	access
1817	5	list	decision	\N	Listed decisions	2026-08-15 13:14:47.787734+00	access
1818	5	list	decision	\N	Listed decisions	2026-08-15 13:16:50.464747+00	access
1833	6	login	user	6	User logged in successfully	2026-08-15 14:47:34.116192+00	security
1875	6	login	user	6	User logged in successfully	2026-08-15 18:09:45.292184+00	security
1900	7	list	decision	\N	Listed decisions	2026-08-15 18:53:07.779714+00	access
1907	7	list	decision	\N	Listed decisions	2026-08-15 18:53:19.779755+00	access
1920	7	list	decision	\N	Listed decisions	2026-08-15 19:24:57.07482+00	access
1921	7	list	decision	\N	Listed decisions	2026-08-15 19:25:09.01489+00	access
1922	7	list	decision	\N	Listed decisions	2026-08-15 19:25:15.67488+00	access
1923	7	list	decision	\N	Listed decisions	2026-08-15 19:25:21.68996+00	access
1924	7	list	decision	\N	Listed decisions	2026-08-15 19:25:31.85486+00	access
1925	7	list	decision	\N	Listed decisions	2026-08-15 19:25:36.739878+00	access
1926	7	list	decision	\N	Listed decisions	2026-08-15 19:25:40.634917+00	access
1927	7	login	user	7	User logged in successfully	2026-08-15 19:32:19.804787+00	security
1928	7	list	decision	\N	Listed decisions	2026-08-15 19:32:41.10969+00	access
1929	7	list	decision	\N	Listed decisions	2026-08-15 19:40:41.597679+00	access
1930	7	list	decision	\N	Listed decisions	2026-08-15 19:40:48.037798+00	access
1932	7	login	user	7	User logged in successfully	2026-08-16 10:22:32.549682+00	security
1954	21	list	decision	\N	Listed decisions	2026-08-16 10:43:24.614699+00	access
1955	21	list	decision	\N	Listed decisions	2026-08-16 10:43:27.05+00	access
1956	21	list	decision	\N	Listed decisions	2026-08-16 10:43:32.309752+00	access
1959	21	list	decision	\N	Listed decisions	2026-08-16 10:43:43.074499+00	access
1962	11	login	user	11	User logged in successfully	2026-08-16 12:31:46.206949+00	security
1964	11	list	decision	\N	Listed decisions	2026-08-16 12:31:49.157053+00	access
1967	21	login	user	21	User logged in successfully	2026-08-16 12:52:23.188933+00	security
1968	21	list	decision	\N	Listed decisions	2026-08-16 12:52:26.873895+00	access
1970	21	list	decision	\N	Listed decisions	2026-08-16 12:52:32.299599+00	access
1975	21	list	decision	\N	Listed decisions	2026-08-16 12:53:10.513999+00	access
2037	17	create	discussion_message	49	Created comment for decision 79	2026-08-16 13:46:17.264598+00	activity
2038	21	list	decision	\N	Listed decisions	2026-08-16 13:46:43.214712+00	access
661	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 11:40:40.259252+00	access
662	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 11:40:40.771192+00	access
665	16	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 11:40:45.972472+00	access
667	16	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 11:40:46.741984+00	access
670	16	list	decision	\N	Listed decisions	2026-08-01 11:40:55.848465+00	access
673	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-01 11:55:09.144912+00	security
674	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-01 11:55:10.244189+00	security
675	5	list	decision	\N	Listed decisions	2026-08-01 11:55:10.212634+00	access
676	5	list	decision	\N	Listed decisions	2026-08-01 11:55:14.08731+00	access
677	5	list	decision	\N	Listed decisions	2026-08-01 11:55:16.729893+00	access
678	5	list	decision	\N	Listed decisions	2026-08-01 11:55:20.361818+00	access
679	5	list	decision	\N	Listed decisions	2026-08-01 11:55:23.164546+00	access
680	5	list	decision	\N	Listed decisions	2026-08-01 11:55:28.182884+00	access
681	5	list	decision	\N	Listed decisions	2026-08-01 12:04:50.158781+00	access
682	5	list	decision	\N	Listed decisions	2026-08-01 12:04:53.270917+00	access
683	5	list	decision	\N	Listed decisions	2026-08-01 12:04:56.143175+00	access
684	5	list	decision	\N	Listed decisions	2026-08-01 12:04:59.452643+00	access
685	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-01 12:06:00.319695+00	security
686	6	list	decision	\N	Listed decisions	2026-08-01 12:06:01.965361+00	access
687	6	list	user	\N	Admin listed all users	2026-08-01 12:06:03.709476+00	access
688	6	list	user	\N	Admin listed all users	2026-08-01 12:06:11.644866+00	access
689	6	list	decision	\N	Listed decisions	2026-08-01 12:06:11.82932+00	access
690	6	list	decision	\N	Listed decisions	2026-08-01 12:06:22.483854+00	access
691	6	list	decision	\N	Listed decisions	2026-08-01 12:06:22.482697+00	access
692	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-01 12:07:08.01233+00	security
693	4	list	decision	\N	Listed decisions	2026-08-01 12:07:08.64259+00	access
694	4	list	decision	\N	Listed decisions	2026-08-01 12:07:11.231846+00	access
695	4	list	decision	\N	Listed decisions	2026-08-01 12:07:14.18155+00	access
696	4	list	decision	\N	Listed decisions	2026-08-01 12:07:16.757584+00	access
697	4	list	decision	\N	Listed decisions	2026-08-01 12:07:19.689299+00	access
698	4	list	decision	\N	Listed decisions	2026-08-01 12:07:22.245627+00	access
699	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:07:31.62888+00	security
700	16	list	decision	\N	Listed decisions	2026-08-01 12:07:32.252038+00	access
701	16	list	decision	\N	Listed decisions	2026-08-01 12:07:34.998057+00	access
702	16	list	decision	\N	Listed decisions	2026-08-01 12:07:37.909118+00	access
703	16	list	decision	\N	Listed decisions	2026-08-01 12:07:40.970144+00	access
704	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-08-01 12:08:01.757921+00	security
705	15	list	decision	\N	Listed decisions	2026-08-01 12:08:02.429581+00	access
706	15	list	decision	\N	Listed decisions	2026-08-01 12:08:05.324909+00	access
707	15	list	decision	\N	Listed decisions	2026-08-01 12:08:08.312596+00	access
708	15	list	decision	\N	Listed decisions	2026-08-01 12:08:10.906081+00	access
709	15	list	decision	\N	Listed decisions	2026-08-01 12:08:13.841133+00	access
710	15	list	decision	\N	Listed decisions	2026-08-01 12:08:16.226887+00	access
711	15	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 12:08:18.215697+00	access
712	15	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 12:08:18.735589+00	access
713	15	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 12:08:32.505943+00	access
714	15	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 12:08:33.024681+00	access
715	15	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 12:08:34.098669+00	access
716	15	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 12:08:34.75942+00	access
717	15	list	decision	\N	Listed decisions	2026-08-01 12:08:37.039188+00	access
718	15	list	decision	\N	Listed decisions	2026-08-01 12:08:39.324255+00	access
719	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:08:41.460935+00	access
720	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:08:41.966235+00	access
721	15	create	discussion_message	30	Created comment for decision 49	2026-08-01 12:09:11.561511+00	activity
722	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:09:20.001011+00	access
723	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:09:44.081542+00	security
724	16	list	decision	\N	Listed decisions	2026-08-01 12:09:46.84828+00	access
725	16	list	decision	\N	Listed decisions	2026-08-01 12:10:01.060207+00	access
726	16	list	decision	\N	Listed decisions	2026-08-01 12:10:08.779482+00	access
727	16	list	decision	\N	Listed decisions	2026-08-01 12:10:08.779387+00	access
728	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:09.722955+00	access
729	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:10.477976+00	access
730	16	create	discussion_message	31	Created reply to comment 30	2026-08-01 12:10:28.163065+00	activity
731	16	create	discussion_message	32	Created reply to comment 30	2026-08-01 12:10:37.516562+00	activity
732	16	create	discussion_message	33	Created reply to comment 30	2026-08-01 12:10:37.529095+00	activity
733	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:37.538088+00	access
734	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:52.058634+00	access
735	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:52.680264+00	access
736	16	delete	discussion_message	31	Deleted comment 31	2026-08-01 12:10:59.200913+00	activity
737	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:10:59.605117+00	access
738	16	delete	discussion_message	32	Deleted comment 32	2026-08-01 12:11:03.346046+00	activity
739	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:11:03.871624+00	access
740	16	update	decision	49	Updated decision 49 (version snapshot v1 saved)	2026-08-01 12:11:26.353251+00	activity
741	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-08-01 12:11:52.186941+00	security
742	15	list	decision	\N	Listed decisions	2026-08-01 12:11:52.821983+00	access
743	15	list	decision	\N	Listed decisions	2026-08-01 12:11:55.950393+00	access
744	15	list	decision	\N	Listed decisions	2026-08-01 12:11:58.830653+00	access
745	15	list	decision	\N	Listed decisions	2026-08-01 12:12:01.986192+00	access
746	15	list	decision	\N	Listed decisions	2026-08-01 12:12:07.215856+00	access
747	15	list	decision	\N	Listed decisions	2026-08-01 12:12:09.569669+00	access
1282	5	list	decision	\N	Listed decisions	2026-08-04 13:22:47.085211+00	access
1287	5	list	decision	\N	Listed decisions	2026-08-04 13:22:52.209841+00	access
1336	6	list	decision	\N	Listed decisions	2026-08-04 14:44:25.959796+00	access
1363	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 17:19:25.78557+00	access
1368	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 17:19:29.834223+00	access
1373	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 17:20:08.240798+00	access
1455	11	list	decision	\N	Listed decisions	2026-08-05 18:51:34.020057+00	access
1456	11	list	decision	\N	Listed decisions	2026-08-05 18:52:21.985919+00	access
1462	11	list	decision	\N	Listed decisions	2026-08-05 19:03:01.348415+00	access
1468	11	list	decision	\N	Listed decisions	2026-08-05 19:04:18.063933+00	access
1476	11	list	decision	\N	Listed decisions	2026-08-05 19:08:31.346583+00	access
1477	11	view_discussion	decision	55	Viewed discussion thread for decision 55	2026-08-05 19:09:21.881206+00	access
1484	11	list	decision	\N	Listed decisions	2026-08-05 19:12:43.607781+00	access
1486	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-05 19:20:30.199835+00	security
1491	11	list	decision	\N	Listed decisions	2026-08-05 19:24:17.784306+00	access
1493	11	list	user	\N	Admin listed all users	2026-08-05 19:24:20.202077+00	access
1495	11	list	decision	\N	Listed decisions	2026-08-05 19:24:26.083523+00	access
1498	11	list	decision	\N	Listed decisions	2026-08-05 19:29:32.864622+00	access
1613	7	login	user	7	User logged in successfully	2026-08-13 19:40:34.190191+00	security
1614	7	create	decision	78	Decision created	2026-08-13 19:40:35.727177+00	activity
1615	7	create	discussion_message	47	Created comment for decision 78	2026-08-13 19:40:37.284072+00	activity
1616	7	create	discussion_message	48	Created meeting note for decision 78	2026-08-13 19:40:38.184244+00	activity
1620	6	list	decision	\N	Listed decisions	2026-08-14 04:23:53.512832+00	access
1637	6	list	decision	\N	Listed decisions	2026-08-14 05:25:19.056186+00	access
1639	6	list	decision	\N	Listed decisions	2026-08-14 05:25:19.71435+00	access
1672	6	list	decision	\N	Listed decisions	2026-08-14 07:37:56.622475+00	access
1673	6	list	decision	\N	Listed decisions	2026-08-14 07:37:57.292543+00	access
1676	7	login	user	7	User logged in successfully	2026-08-14 08:38:30.793979+00	security
1678	6	list	decision	\N	Listed decisions	2026-08-14 09:18:47.26368+00	access
1680	7	login	user	7	User logged in successfully	2026-08-14 09:19:19.946627+00	security
1683	6	list	decision	\N	Listed decisions	2026-08-14 09:20:47.996463+00	access
1685	6	list	decision	\N	Listed decisions	2026-08-14 09:21:38.188155+00	access
1687	6	list	decision	\N	Listed decisions	2026-08-14 09:21:53.858072+00	access
1697	11	list	decision	\N	Listed decisions	2026-08-14 12:15:27.488101+00	access
1726	6	list	decision	\N	Listed decisions	2026-08-14 15:56:36.033918+00	access
1755	6	list	decision	\N	Listed decisions	2026-08-14 17:42:38.232579+00	access
1764	6	list	decision	\N	Listed decisions	2026-08-14 17:49:25.22273+00	access
1767	6	list	decision	\N	Listed decisions	2026-08-14 17:49:44.757121+00	access
1772	7	login	user	7	User logged in successfully	2026-08-15 10:22:12.908653+00	security
1774	7	list	decision	\N	Listed decisions	2026-08-15 10:35:51.577842+00	access
1812	5	list	decision	\N	Listed decisions	2026-08-15 13:14:05.849434+00	access
1813	5	list	decision	\N	Listed decisions	2026-08-15 13:14:07.548706+00	access
1834	6	list	decision	\N	Listed decisions	2026-08-15 14:47:38.695308+00	access
1837	6	list	decision	\N	Listed decisions	2026-08-15 14:47:49.815102+00	access
1876	6	list	decision	\N	Listed decisions	2026-08-15 18:09:50.547504+00	access
1901	7	list	decision	\N	Listed decisions	2026-08-15 18:53:09.840777+00	access
1904	7	list	decision	\N	Listed decisions	2026-08-15 18:53:13.219767+00	access
1911	7	list	decision	\N	Listed decisions	2026-08-15 18:55:32.998754+00	access
1914	7	list	decision	\N	Listed decisions	2026-08-15 18:55:38.018713+00	access
1931	7	list	decision	\N	Listed decisions	2026-08-15 19:50:17.218304+00	access
1933	7	list	decision	\N	Listed decisions	2026-08-16 10:22:38.637209+00	access
1937	7	list	decision	\N	Listed decisions	2026-08-16 10:23:27.992004+00	access
1939	7	list	decision	\N	Listed decisions	2026-08-16 10:24:26.132421+00	access
1941	7	list	decision	\N	Listed decisions	2026-08-16 10:24:31.027032+00	access
1945	21	list	decision	\N	Listed decisions	2026-08-16 10:25:04.241973+00	access
1949	21	list	decision	\N	Listed decisions	2026-08-16 10:25:20.31704+00	access
1950	21	list	decision	\N	Listed decisions	2026-08-16 10:26:02.277092+00	access
1951	21	list	decision	\N	Listed decisions	2026-08-16 10:26:41.671945+00	access
1957	21	list	decision	\N	Listed decisions	2026-08-16 10:43:32.749754+00	access
1958	21	list	decision	\N	Listed decisions	2026-08-16 10:43:38.974957+00	access
1960	21	list	decision	\N	Listed decisions	2026-08-16 10:43:43.074409+00	access
1963	11	list	decision	\N	Listed decisions	2026-08-16 12:31:48.521943+00	access
1969	21	list	decision	\N	Listed decisions	2026-08-16 12:52:30.678576+00	access
1972	21	list	decision	\N	Listed decisions	2026-08-16 12:52:34.83903+00	access
2039	21	list	decision	\N	Listed decisions	2026-08-16 13:46:49.761484+00	access
748	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:12:23.466999+00	access
754	16	list	decision	\N	Listed decisions	2026-08-01 12:13:14.368675+00	access
1283	5	list	decision	\N	Listed decisions	2026-08-04 13:22:48.045695+00	access
1289	5	list	decision	\N	Listed decisions	2026-08-04 13:23:03.740224+00	access
1300	4	list	decision	\N	Listed decisions	2026-08-04 13:23:28.605062+00	access
1305	7	list	decision	\N	Listed decisions	2026-08-04 13:23:37.485172+00	access
1306	7	list	decision	\N	Listed decisions	2026-08-04 13:23:40.535697+00	access
1374	6	list	decision	\N	Listed decisions	2026-08-04 17:42:20.383971+00	access
1379	6	list	decision	\N	Listed decisions	2026-08-04 17:42:41.713971+00	access
1458	11	list	decision	\N	Listed decisions	2026-08-05 18:52:38.990696+00	access
1460	11	list	decision	\N	Listed decisions	2026-08-05 18:59:49.123778+00	access
1465	11	list	decision	\N	Listed decisions	2026-08-05 19:03:12.020338+00	access
1466	11	list	decision	\N	Listed decisions	2026-08-05 19:04:12.154547+00	access
1470	11	list	decision	\N	Listed decisions	2026-08-05 19:06:40.42842+00	access
1472	11	list	decision	\N	Listed decisions	2026-08-05 19:06:46.314955+00	access
1473	11	list	decision	\N	Listed decisions	2026-08-05 19:08:19.772372+00	access
1478	11	view_discussion	decision	55	Viewed discussion thread for decision 55	2026-08-05 19:09:22.365114+00	access
1489	11	list	decision	\N	Listed decisions	2026-08-05 19:20:38.397692+00	access
1617	11	list	decision	\N	Listed decisions	2026-08-13 19:41:56.170934+00	access
1621	6	list	decision	\N	Listed decisions	2026-08-14 04:23:52.084821+00	access
1623	6	list	decision	\N	Listed decisions	2026-08-14 04:23:59.988103+00	access
1638	6	list	decision	\N	Listed decisions	2026-08-14 05:25:17.974568+00	access
1674	6	list	decision	\N	Listed decisions	2026-08-14 07:37:59.36064+00	access
1681	6	list	decision	\N	Listed decisions	2026-08-14 09:20:29.272907+00	access
1686	6	list	decision	\N	Listed decisions	2026-08-14 09:21:46.481282+00	access
1698	11	list	decision	\N	Listed decisions	2026-08-14 12:15:26.090368+00	access
1727	6	list	decision	\N	Listed decisions	2026-08-14 15:56:34.582793+00	access
1733	6	list	decision	\N	Listed decisions	2026-08-14 15:58:24.497798+00	access
1756	6	list	decision	\N	Listed decisions	2026-08-14 17:42:37.442188+00	access
1765	6	list	decision	\N	Listed decisions	2026-08-14 17:49:26.208048+00	access
1775	7	list	decision	\N	Listed decisions	2026-08-15 10:35:50.052711+00	access
1777	7	list	decision	\N	Listed decisions	2026-08-15 10:36:07.327571+00	access
1814	5	list	decision	\N	Listed decisions	2026-08-15 13:14:05.501887+00	access
1835	6	list	decision	\N	Listed decisions	2026-08-15 14:47:37.760456+00	access
1877	6	list	decision	\N	Listed decisions	2026-08-15 18:09:49.034435+00	access
1902	7	list	decision	\N	Listed decisions	2026-08-15 18:53:11.488385+00	access
1913	7	list	decision	\N	Listed decisions	2026-08-15 18:55:36.392869+00	access
1934	7	list	decision	\N	Listed decisions	2026-08-16 10:22:39.749132+00	access
1936	7	list	decision	\N	Listed decisions	2026-08-16 10:22:46.628674+00	access
1943	21	login	user	21	User logged in successfully	2026-08-16 10:24:57.584136+00	security
1947	21	list	decision	\N	Listed decisions	2026-08-16 10:25:09.054512+00	access
1961	21	list	decision	\N	Listed decisions	2026-08-16 10:43:44.055609+00	access
1965	11	list	decision	\N	Listed decisions	2026-08-16 12:40:09.689856+00	access
1966	11	list	decision	\N	Listed decisions	2026-08-16 12:40:11.530725+00	access
1971	21	list	decision	\N	Listed decisions	2026-08-16 12:52:33.154543+00	access
1973	21	list	decision	\N	Listed decisions	2026-08-16 12:52:39.789319+00	access
2040	17	list	decision	\N	Listed decisions	2026-08-16 14:22:42.195458+00	access
749	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:12:24.181949+00	access
755	16	list	decision	\N	Listed decisions	2026-08-01 12:13:17.269756+00	access
757	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:13:22.096809+00	access
758	16	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:13:22.774312+00	access
1284	5	list	decision	\N	Listed decisions	2026-08-04 13:22:48.686934+00	access
1286	5	list	decision	\N	Listed decisions	2026-08-04 13:22:50.451175+00	access
1291	21	list	decision	\N	Listed decisions	2026-08-04 13:23:14.456191+00	access
1296	21	list	decision	\N	Listed decisions	2026-08-04 13:23:20.121158+00	access
1375	6	list	user	\N	Admin listed all users	2026-08-04 17:42:22.917357+00	access
1492	11	list	user	\N	Admin listed all users	2026-08-05 19:24:18.474769+00	access
1618	11	list	decision	\N	Listed decisions	2026-08-13 19:41:57.254601+00	access
1622	6	list	decision	\N	Listed decisions	2026-08-14 04:23:54.565386+00	access
1640	6	list	decision	\N	Listed decisions	2026-08-14 05:25:23.724785+00	access
1682	6	list	decision	\N	Listed decisions	2026-08-14 09:20:36.642752+00	access
1689	6	list	decision	\N	Listed decisions	2026-08-14 09:22:12.184348+00	access
1699	11	list	decision	\N	Listed decisions	2026-08-14 12:22:35.999222+00	access
1728	6	list	decision	\N	Listed decisions	2026-08-14 15:56:38.108279+00	access
1758	6	list	decision	\N	Listed decisions	2026-08-14 17:42:44.68036+00	access
1766	6	list	decision	\N	Listed decisions	2026-08-14 17:49:29.623416+00	access
1776	7	list	decision	\N	Listed decisions	2026-08-15 10:35:58.854685+00	access
1816	5	list	decision	\N	Listed decisions	2026-08-15 13:14:43.179906+00	access
1836	6	list	decision	\N	Listed decisions	2026-08-15 14:47:40.402353+00	access
1878	6	list	decision	\N	Listed decisions	2026-08-15 18:09:52.476014+00	access
1880	6	list	decision	\N	Listed decisions	2026-08-15 18:10:21.501022+00	access
1903	7	list	decision	\N	Listed decisions	2026-08-15 18:53:11.893017+00	access
1906	7	list	decision	\N	Listed decisions	2026-08-15 18:53:15.172433+00	access
1909	7	list	decision	\N	Listed decisions	2026-08-15 18:55:29.544963+00	access
1910	7	list	decision	\N	Listed decisions	2026-08-15 18:55:31.472606+00	access
1915	7	list	decision	\N	Listed decisions	2026-08-15 18:55:41.192358+00	access
1935	7	list	decision	\N	Listed decisions	2026-08-16 10:22:46.151418+00	access
1938	7	list	decision	\N	Listed decisions	2026-08-16 10:23:34.711734+00	access
1940	7	list	decision	\N	Listed decisions	2026-08-16 10:24:27.431628+00	access
1942	7	list	decision	\N	Listed decisions	2026-08-16 10:24:31.671564+00	access
1944	21	list	decision	\N	Listed decisions	2026-08-16 10:25:03.116168+00	access
1946	21	list	decision	\N	Listed decisions	2026-08-16 10:25:06.231022+00	access
1948	21	list	decision	\N	Listed decisions	2026-08-16 10:25:13.837119+00	access
1952	21	list	decision	\N	Listed decisions	2026-08-16 10:26:54.791601+00	access
1974	21	list	decision	\N	Listed decisions	2026-08-16 12:52:55.161651+00	access
2041	17	list	decision	\N	Listed decisions	2026-08-16 14:22:46.625326+00	access
2046	17	list	decision	\N	Listed decisions	2026-08-16 14:22:54.514265+00	access
2047	17	list	decision	\N	Listed decisions	2026-08-16 14:23:00.233183+00	access
750	15	create	discussion_message	34	Created comment for decision 49	2026-08-01 12:12:36.154416+00	activity
751	15	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 12:12:43.273165+00	access
753	16	list	decision	\N	Listed decisions	2026-08-01 12:13:11.767258+00	access
1288	5	list	decision	\N	Listed decisions	2026-08-04 13:22:58.366237+00	access
1290	21	login	user	21	User logged in successfully: reviewer.tech@example.com	2026-08-04 13:23:13.081353+00	security
1292	21	list	decision	\N	Listed decisions	2026-08-04 13:23:15.151763+00	access
1297	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-04 13:23:25.721606+00	security
1302	4	list	decision	\N	Listed decisions	2026-08-04 13:23:30.056451+00	access
1304	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 13:23:36.216341+00	security
1307	7	list	decision	\N	Listed decisions	2026-08-04 13:23:39.261594+00	access
1309	7	list	decision	\N	Listed decisions	2026-08-04 13:23:46.232073+00	access
1317	4	list	decision	\N	Listed decisions	2026-08-04 14:08:14.18492+00	access
1376	6	list	user	\N	Admin listed all users	2026-08-04 17:42:28.457961+00	access
1378	6	list	decision	\N	Listed decisions	2026-08-04 17:42:36.542938+00	access
1624	6	list	decision	\N	Listed decisions	2026-08-14 04:50:10.918462+00	access
1641	6	list	decision	\N	Listed decisions	2026-08-14 05:32:01.090226+00	access
1691	6	list	decision	\N	Listed decisions	2026-08-14 09:22:33.193021+00	access
1700	11	list	decision	\N	Listed decisions	2026-08-14 12:22:35.116949+00	access
1729	6	list	decision	\N	Listed decisions	2026-08-14 15:56:50.967472+00	access
1759	6	list	decision	\N	Listed decisions	2026-08-14 17:42:57.603028+00	access
1762	6	list	decision	\N	Listed decisions	2026-08-14 17:43:04.902914+00	access
1768	6	list	decision	\N	Listed decisions	2026-08-14 17:49:50.562904+00	access
1778	7	list	decision	\N	Listed decisions	2026-08-15 10:46:59.583825+00	access
1819	5	list	decision	\N	Listed decisions	2026-08-15 13:17:09.998282+00	access
1838	6	list	decision	\N	Listed decisions	2026-08-15 15:01:30.384176+00	access
1879	6	list	decision	\N	Listed decisions	2026-08-15 18:10:07.114205+00	access
1905	7	list	decision	\N	Listed decisions	2026-08-15 18:53:15.023711+00	access
1908	7	list	decision	\N	Listed decisions	2026-08-15 18:55:29.988022+00	access
1953	21	list	decision	\N	Listed decisions	2026-08-16 10:27:11.591703+00	access
1976	21	list	decision	\N	Listed decisions	2026-08-16 13:05:45.71886+00	access
1979	21	list	decision	\N	Listed decisions	2026-08-16 13:05:52.343255+00	access
1980	21	list	decision	\N	Listed decisions	2026-08-16 13:06:31.673159+00	access
2042	17	list	decision	\N	Listed decisions	2026-08-16 14:22:49.689412+00	access
752	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:13:11.147102+00	security
756	16	list	decision	\N	Listed decisions	2026-08-01 12:13:20.422265+00	access
759	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:40:35.29841+00	security
760	16	list	decision	\N	Listed decisions	2026-08-01 12:40:56.365016+00	access
761	16	list	decision	\N	Listed decisions	2026-08-01 12:40:56.366344+00	access
762	16	list	decision	\N	Listed decisions	2026-08-01 12:40:57.821685+00	access
763	16	list	decision	\N	Listed decisions	2026-08-01 12:41:01.286076+00	access
764	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:42:26.26814+00	security
765	16	list	decision	\N	Listed decisions	2026-08-01 12:42:46.947395+00	access
766	16	list	decision	\N	Listed decisions	2026-08-01 12:42:47.09056+00	access
767	16	list	decision	\N	Listed decisions	2026-08-01 12:42:47.09023+00	access
768	16	list	decision	\N	Listed decisions	2026-08-01 12:42:47.29867+00	access
769	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 12:55:45.949233+00	security
770	16	list	decision	\N	Listed decisions	2026-08-01 12:55:47.420612+00	access
771	16	list	decision	\N	Listed decisions	2026-08-01 12:55:49.764212+00	access
772	16	list	decision	\N	Listed decisions	2026-08-01 12:55:52.486869+00	access
773	16	list	decision	\N	Listed decisions	2026-08-01 12:55:55.134889+00	access
774	16	list	decision	\N	Listed decisions	2026-08-01 12:56:07.407184+00	access
775	16	list	decision	\N	Listed decisions	2026-08-01 12:56:10.542651+00	access
776	16	list	decision	\N	Listed decisions	2026-08-01 12:59:59.4093+00	access
777	16	list	decision	\N	Listed decisions	2026-08-01 13:00:01.981751+00	access
778	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:00:03.277038+00	access
779	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:00:03.803366+00	access
780	16	list	decision	\N	Listed decisions	2026-08-01 13:00:12.725068+00	access
781	16	list	decision	\N	Listed decisions	2026-08-01 13:00:15.542147+00	access
782	16	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-08-01 13:00:40.290582+00	access
783	16	view_discussion	decision	30	Viewed discussion thread for decision 30	2026-08-01 13:00:41.075956+00	access
784	16	list	decision	\N	Listed decisions	2026-08-01 13:00:44.138302+00	access
785	16	list	decision	\N	Listed decisions	2026-08-01 13:00:46.766029+00	access
786	16	list	decision	\N	Listed decisions	2026-08-01 13:05:42.202443+00	access
787	16	list	decision	\N	Listed decisions	2026-08-01 13:05:44.438108+00	access
788	16	list	decision	\N	Listed decisions	2026-08-01 13:05:47.018939+00	access
789	16	list	decision	\N	Listed decisions	2026-08-01 13:05:49.34201+00	access
790	16	list	decision	\N	Listed decisions	2026-08-01 13:05:51.928732+00	access
791	16	list	decision	\N	Listed decisions	2026-08-01 13:05:54.168643+00	access
792	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 13:16:34.622947+00	security
793	16	list	decision	\N	Listed decisions	2026-08-01 13:16:35.63557+00	access
794	16	list	decision	\N	Listed decisions	2026-08-01 13:16:37.873982+00	access
795	16	list	decision	\N	Listed decisions	2026-08-01 13:16:40.159992+00	access
796	16	list	decision	\N	Listed decisions	2026-08-01 13:16:42.478331+00	access
797	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-08-01 13:16:58.540151+00	security
798	15	list	decision	\N	Listed decisions	2026-08-01 13:16:59.158108+00	access
799	15	list	decision	\N	Listed decisions	2026-08-01 13:17:01.292931+00	access
800	15	list	decision	\N	Listed decisions	2026-08-01 13:17:03.889583+00	access
801	15	list	decision	\N	Listed decisions	2026-08-01 13:17:05.975611+00	access
802	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-01 13:17:46.27576+00	security
803	5	list	decision	\N	Listed decisions	2026-08-01 13:17:46.915745+00	access
804	5	list	decision	\N	Listed decisions	2026-08-01 13:17:49.519084+00	access
805	5	list	decision	\N	Listed decisions	2026-08-01 13:17:51.89727+00	access
806	5	list	decision	\N	Listed decisions	2026-08-01 13:17:54.553518+00	access
807	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:17:56.578444+00	access
808	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:17:57.160199+00	access
809	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:11.451916+00	access
810	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:12.072484+00	access
811	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:14.387604+00	access
812	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:15.015195+00	access
813	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:16.340996+00	access
814	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:16.959582+00	access
815	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:18.151568+00	access
816	5	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-01 13:18:18.780455+00	access
817	5	list	decision	\N	Listed decisions	2026-08-01 13:18:40.482557+00	access
818	5	list	decision	\N	Listed decisions	2026-08-01 13:18:42.974272+00	access
819	5	update_status	decision	50	Updated status of decision 50 from draft to under_review	2026-08-01 13:18:51.613284+00	activity
820	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-01 13:19:26.578897+00	security
821	4	list	decision	\N	Listed decisions	2026-08-01 13:19:27.160954+00	access
822	4	list	decision	\N	Listed decisions	2026-08-01 13:19:29.647425+00	access
823	4	list	decision	\N	Listed decisions	2026-08-01 13:19:31.930123+00	access
824	4	list	decision	\N	Listed decisions	2026-08-01 13:19:34.345901+00	access
825	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-01 13:20:02.780921+00	security
826	6	list	decision	\N	Listed decisions	2026-08-01 13:20:04.194966+00	access
827	6	list	user	\N	Admin listed all users	2026-08-01 13:20:05.113738+00	access
828	6	list	user	\N	Admin listed all users	2026-08-01 13:20:06.499186+00	access
829	6	list	decision	\N	Listed decisions	2026-08-01 13:20:06.996205+00	access
830	6	list	decision	\N	Listed decisions	2026-08-01 13:20:09.150717+00	access
831	6	list	decision	\N	Listed decisions	2026-08-01 13:20:11.875649+00	access
832	6	list	decision	\N	Listed decisions	2026-08-01 13:20:13.934501+00	access
833	6	list	decision	\N	Listed decisions	2026-08-01 13:20:16.390927+00	access
834	6	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:20:24.245328+00	access
835	6	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:20:24.71118+00	access
836	6	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:20:28.981042+00	access
837	6	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:20:29.403958+00	access
838	6	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 13:20:38.296497+00	access
843	6	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:20:44.071482+00	access
846	6	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:21:04.281602+00	access
850	16	list	decision	\N	Listed decisions	2026-08-01 13:21:48.180548+00	access
852	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:21:52.385374+00	access
856	16	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 13:21:59.016961+00	access
858	16	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 13:22:07.66486+00	access
865	15	list	decision	\N	Listed decisions	2026-08-01 13:22:42.650636+00	access
1294	21	list	decision	\N	Listed decisions	2026-08-04 13:23:16.123851+00	access
1299	4	list	decision	\N	Listed decisions	2026-08-04 13:23:26.844438+00	access
1301	4	list	decision	\N	Listed decisions	2026-08-04 13:23:29.403725+00	access
1308	7	list	decision	\N	Listed decisions	2026-08-04 13:23:43.323965+00	access
1314	4	list	decision	\N	Listed decisions	2026-08-04 13:34:41.013985+00	access
1377	6	list	decision	\N	Listed decisions	2026-08-04 17:42:28.834184+00	access
1625	6	list	decision	\N	Listed decisions	2026-08-14 04:50:10.371846+00	access
1642	6	list	decision	\N	Listed decisions	2026-08-14 05:32:02.173709+00	access
1692	6	list	decision	\N	Listed decisions	2026-08-14 09:24:05.545011+00	access
1701	11	login	user	11	User logged in successfully	2026-08-14 12:27:02.25519+00	security
1731	6	list	decision	\N	Listed decisions	2026-08-14 15:58:21.218584+00	access
1760	6	list	decision	\N	Listed decisions	2026-08-14 17:42:58.502547+00	access
1779	7	list	decision	\N	Listed decisions	2026-08-15 10:46:58.47346+00	access
1820	5	list	decision	\N	Listed decisions	2026-08-15 13:26:01.801934+00	access
1825	5	list	decision	\N	Listed decisions	2026-08-15 13:26:29.951555+00	access
1839	6	list	decision	\N	Listed decisions	2026-08-15 15:01:29.184701+00	access
1881	6	list	decision	\N	Listed decisions	2026-08-15 18:10:21.500582+00	access
1912	7	list	decision	\N	Listed decisions	2026-08-15 18:55:34.02162+00	access
1977	21	list	decision	\N	Listed decisions	2026-08-16 13:05:47.560667+00	access
1983	21	list	decision	\N	Listed decisions	2026-08-16 13:07:02.405695+00	access
1988	21	list	decision	\N	Listed decisions	2026-08-16 13:07:22.475542+00	access
2043	17	list	decision	\N	Listed decisions	2026-08-16 14:22:50.318107+00	access
2045	17	list	decision	\N	Listed decisions	2026-08-16 14:22:54.197044+00	access
839	6	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 13:20:38.71137+00	access
851	16	list	decision	\N	Listed decisions	2026-08-01 13:21:50.575175+00	access
857	16	view_versions	decision	50	Viewed versions for decision 50	2026-08-01 13:21:59.446664+00	access
859	16	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 13:22:08.0927+00	access
867	15	list	decision	\N	Listed decisions	2026-08-01 13:22:47.536519+00	access
1298	4	list	decision	\N	Listed decisions	2026-08-04 13:23:27.817867+00	access
1303	4	list	decision	\N	Listed decisions	2026-08-04 13:23:33.572516+00	access
1626	6	list	decision	\N	Listed decisions	2026-08-14 04:50:11.550978+00	access
1643	6	list	decision	\N	Listed decisions	2026-08-14 05:32:00.741593+00	access
1693	6	list	decision	\N	Listed decisions	2026-08-14 09:24:06.668047+00	access
1702	11	login	user	11	User logged in successfully	2026-08-14 12:30:34.960595+00	security
1734	6	list	decision	\N	Listed decisions	2026-08-14 16:04:41.08799+00	access
1761	6	list	decision	\N	Listed decisions	2026-08-14 17:42:57.300896+00	access
1780	7	list	decision	\N	Listed decisions	2026-08-15 10:47:08.691683+00	access
1821	5	list	decision	\N	Listed decisions	2026-08-15 13:26:03.719712+00	access
1824	5	list	decision	\N	Listed decisions	2026-08-15 13:26:20.63025+00	access
1840	6	list	decision	\N	Listed decisions	2026-08-15 15:01:34.17721+00	access
1882	7	login	user	7	User logged in successfully	2026-08-15 18:16:03.559774+00	security
1888	7	list	decision	\N	Listed decisions	2026-08-15 18:16:28.634684+00	access
1916	7	list	decision	\N	Listed decisions	2026-08-15 19:10:56.608108+00	access
1978	21	list	decision	\N	Listed decisions	2026-08-16 13:05:51.052774+00	access
1985	21	list	decision	\N	Listed decisions	2026-08-16 13:07:04.608525+00	access
1987	21	list	decision	\N	Listed decisions	2026-08-16 13:07:10.002675+00	access
2044	17	list	decision	\N	Listed decisions	2026-08-16 14:22:52.102319+00	access
840	6	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 13:20:41.744649+00	access
844	6	approve	decision	50	Approved decision 50 with comment: tested	2026-08-01 13:20:58.608051+00	activity
849	16	list	decision	\N	Listed decisions	2026-08-01 13:21:45.942507+00	access
860	16	compare_alternatives	decision	50	Compared alternatives for decision 50	2026-08-01 13:22:09.646034+00	access
862	16	list	decision	\N	Listed decisions	2026-08-01 13:22:23.24481+00	access
864	15	list	decision	\N	Listed decisions	2026-08-01 13:22:40.306822+00	access
1311	16	list	decision	\N	Listed decisions	2026-08-04 13:31:45.653239+00	access
1627	6	list	decision	\N	Listed decisions	2026-08-14 04:50:14.804574+00	access
1644	6	list	decision	\N	Listed decisions	2026-08-14 05:32:08.847631+00	access
1694	6	list	decision	\N	Listed decisions	2026-08-14 09:24:05.106423+00	access
1703	11	login	user	11	User logged in successfully	2026-08-14 12:30:36.723614+00	security
1704	11	list	decision	\N	Listed decisions	2026-08-14 12:30:39.474293+00	access
1735	6	list	decision	\N	Listed decisions	2026-08-14 16:04:58.688753+00	access
1781	7	list	decision	\N	Listed decisions	2026-08-15 10:47:13.413426+00	access
1822	5	list	decision	\N	Listed decisions	2026-08-15 13:26:00.735243+00	access
1841	6	list	decision	\N	Listed decisions	2026-08-15 15:01:48.726181+00	access
1883	7	list	decision	\N	Listed decisions	2026-08-15 18:16:07.247993+00	access
1917	7	list	decision	\N	Listed decisions	2026-08-15 19:11:39.647043+00	access
1981	21	list	decision	\N	Listed decisions	2026-08-16 13:06:39.532751+00	access
1982	21	list	decision	\N	Listed decisions	2026-08-16 13:07:00.453135+00	access
1984	21	list	decision	\N	Listed decisions	2026-08-16 13:07:04.153214+00	access
1989	21	list	decision	\N	Listed decisions	2026-08-16 13:07:25.333082+00	access
2048	17	list	decision	\N	Listed decisions	2026-08-16 14:31:03.927775+00	access
2052	17	list	decision	\N	Listed decisions	2026-08-16 14:31:14.1232+00	access
841	6	list_alternatives	decision	50	Viewed alternatives list for decision 50	2026-08-01 13:20:42.239055+00	access
845	6	view	decision	50	Viewed decision: texting	2026-08-01 13:21:04.28368+00	access
847	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-01 13:21:41.406419+00	security
853	16	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-01 13:21:52.807553+00	access
855	16	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:21:57.082941+00	access
866	15	list	decision	\N	Listed decisions	2026-08-01 13:22:45.000985+00	access
1312	16	list	decision	\N	Listed decisions	2026-08-04 13:31:48.053651+00	access
1628	6	list	decision	\N	Listed decisions	2026-08-14 04:57:17.695194+00	access
1629	6	list	decision	\N	Listed decisions	2026-08-14 04:57:18.551454+00	access
1645	6	list	decision	\N	Listed decisions	2026-08-14 05:37:53.210627+00	access
1695	6	list	decision	\N	Listed decisions	2026-08-14 09:24:13.004807+00	access
1705	11	list	decision	\N	Listed decisions	2026-08-14 12:30:38.693729+00	access
1736	6	list	decision	\N	Listed decisions	2026-08-14 16:19:47.333356+00	access
1782	7	list	decision	\N	Listed decisions	2026-08-15 10:55:27.624724+00	access
1784	7	list	decision	\N	Listed decisions	2026-08-15 10:55:32.625411+00	access
1786	7	list	decision	\N	Listed decisions	2026-08-15 10:55:44.730402+00	access
1788	7	list	decision	\N	Listed decisions	2026-08-15 10:58:07.501188+00	access
1793	7	list	decision	\N	Listed decisions	2026-08-15 10:59:24.769596+00	access
1823	5	list	decision	\N	Listed decisions	2026-08-15 13:26:18.884889+00	access
1842	7	login	user	7	User logged in successfully	2026-08-15 15:27:59.948611+00	security
1884	7	list	decision	\N	Listed decisions	2026-08-15 18:16:06.424799+00	access
1886	7	list	decision	\N	Listed decisions	2026-08-15 18:16:20.139788+00	access
1887	7	list	decision	\N	Listed decisions	2026-08-15 18:16:28.639882+00	access
1918	7	list	decision	\N	Listed decisions	2026-08-15 19:12:46.229429+00	access
1986	21	list	decision	\N	Listed decisions	2026-08-16 13:07:06.766048+00	access
2049	17	list	decision	\N	Listed decisions	2026-08-16 14:31:08.119168+00	access
2053	17	list	decision	\N	Listed decisions	2026-08-16 14:31:17.129475+00	access
2055	17	list	decision	\N	Listed decisions	2026-08-16 14:31:21.794355+00	access
842	6	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:20:43.587265+00	access
848	16	list	decision	\N	Listed decisions	2026-08-01 13:21:42.745586+00	access
854	16	view_approvals	decision	50	Viewed approvals for decision 50	2026-08-01 13:21:56.504913+00	access
861	16	list	decision	\N	Listed decisions	2026-08-01 13:22:20.889098+00	access
863	15	login	user	15	User logged in successfully: isha11@gmail.com	2026-08-01 13:22:39.726996+00	security
868	17	login	user	17	User logged in successfully: kulsum@gmail.com	2026-08-01 14:24:19.148776+00	security
869	17	list	decision	\N	Listed decisions	2026-08-01 14:24:20.762255+00	access
870	17	list	decision	\N	Listed decisions	2026-08-01 14:24:24.684179+00	access
871	17	list	decision	\N	Listed decisions	2026-08-01 14:24:28.192803+00	access
872	17	list	decision	\N	Listed decisions	2026-08-01 14:24:31.952207+00	access
873	17	list	decision	\N	Listed decisions	2026-08-01 14:24:35.398241+00	access
874	17	list	decision	\N	Listed decisions	2026-08-01 14:24:39.317278+00	access
875	17	list	decision	\N	Listed decisions	2026-08-01 14:34:47.19901+00	access
876	17	login	user	17	User logged in successfully: kulsum@gmail.com	2026-08-01 14:35:09.197153+00	security
877	17	list	decision	\N	Listed decisions	2026-08-01 14:35:10.402305+00	access
878	17	list	decision	\N	Listed decisions	2026-08-01 14:35:13.923942+00	access
879	17	list	decision	\N	Listed decisions	2026-08-01 14:35:17.687288+00	access
880	17	list	decision	\N	Listed decisions	2026-08-01 14:35:21.362166+00	access
881	17	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-08-01 14:37:26.724569+00	access
882	17	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-08-01 14:37:27.52764+00	access
883	17	list	decision	\N	Listed decisions	2026-08-01 14:37:36.137148+00	access
884	17	list	decision	\N	Listed decisions	2026-08-01 14:37:40.258997+00	access
885	17	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-08-01 14:37:45.837267+00	access
886	17	view_discussion	decision	34	Viewed discussion thread for decision 34	2026-08-01 14:37:46.487129+00	access
887	17	list	decision	\N	Listed decisions	2026-08-01 15:19:09.50852+00	access
888	17	list	decision	\N	Listed decisions	2026-08-01 15:19:19.029002+00	access
889	17	list	decision	\N	Listed decisions	2026-08-01 15:19:28.552244+00	access
890	17	list	decision	\N	Listed decisions	2026-08-01 15:25:42.217523+00	access
891	17	list	decision	\N	Listed decisions	2026-08-01 15:25:52.238948+00	access
892	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-02 14:27:58.683293+00	security
893	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-02 14:29:29.648375+00	security
894	5	list	decision	\N	Listed decisions	2026-08-02 14:29:33.32814+00	access
895	5	list	decision	\N	Listed decisions	2026-08-02 14:29:41.724091+00	access
896	5	list	decision	\N	Listed decisions	2026-08-02 14:29:50.377988+00	access
897	5	list	decision	\N	Listed decisions	2026-08-02 14:29:54.142339+00	access
898	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-02 14:39:09.773338+00	security
899	5	list	decision	\N	Listed decisions	2026-08-02 14:39:15.149857+00	access
900	5	list	decision	\N	Listed decisions	2026-08-02 14:39:22.898718+00	access
901	5	list	decision	\N	Listed decisions	2026-08-02 14:39:31.90009+00	access
902	5	list	decision	\N	Listed decisions	2026-08-02 14:39:35.543506+00	access
903	5	create	decision	51	Created decision: Adopt New Project Management Tool	2026-08-02 14:47:00.808739+00	activity
904	5	list	decision	\N	Listed decisions	2026-08-02 14:47:17.005599+00	access
905	5	list	decision	\N	Listed decisions	2026-08-02 14:47:22.728335+00	access
906	5	view_discussion	decision	51	Viewed discussion thread for decision 51	2026-08-02 14:48:40.465118+00	access
907	5	view_discussion	decision	51	Viewed discussion thread for decision 51	2026-08-02 14:48:42.04848+00	access
908	5	view_approvals	decision	51	Viewed approvals for decision 51	2026-08-02 14:48:42.623281+00	access
909	5	view_approvals	decision	51	Viewed approvals for decision 51	2026-08-02 14:48:45.188262+00	access
910	5	list	decision	\N	Listed decisions	2026-08-02 14:52:08.689387+00	access
911	5	list	decision	\N	Listed decisions	2026-08-02 14:52:16.409935+00	access
912	5	list	decision	\N	Listed decisions	2026-08-02 14:52:24.908676+00	access
913	5	list	decision	\N	Listed decisions	2026-08-02 14:52:29.143548+00	access
914	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-02 14:52:34.044238+00	security
915	7	list	decision	\N	Listed decisions	2026-08-02 14:52:35.368311+00	access
916	7	list	decision	\N	Listed decisions	2026-08-02 14:52:42.948474+00	access
917	7	list	decision	\N	Listed decisions	2026-08-02 14:52:52.869179+00	access
918	7	list	decision	\N	Listed decisions	2026-08-02 14:52:55.624117+00	access
919	7	list	decision	\N	Listed decisions	2026-08-02 14:53:00.939789+00	access
920	7	list	decision	\N	Listed decisions	2026-08-02 14:53:03.304386+00	access
921	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-08-02 14:53:15.944214+00	access
922	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-08-02 14:53:17.450137+00	access
923	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-08-02 14:53:17.423656+00	access
924	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-08-02 14:53:21.068531+00	access
925	21	register	user	21	User registered with email: reviewer.tech@example.com	2026-08-02 16:22:28.771234+00	security
926	21	login	user	21	User logged in successfully: reviewer.tech@example.com	2026-08-02 16:22:40.961005+00	security
927	21	list	decision	\N	Listed decisions	2026-08-02 16:22:43.712931+00	access
928	21	list	decision	\N	Listed decisions	2026-08-02 16:22:53.575851+00	access
929	21	list	decision	\N	Listed decisions	2026-08-02 16:23:04.230611+00	access
930	21	list	decision	\N	Listed decisions	2026-08-02 16:23:04.228472+00	access
931	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-02 16:24:01.857821+00	security
932	6	list	user	\N	Admin listed all users	2026-08-02 16:24:04.381122+00	access
933	6	list	decision	\N	Listed decisions	2026-08-02 16:24:03.818062+00	access
934	6	list	user	\N	Admin listed all users	2026-08-02 16:24:11.503564+00	access
935	6	list	decision	\N	Listed decisions	2026-08-02 16:24:16.618397+00	access
936	6	list	decision	\N	Listed decisions	2026-08-02 16:24:24.49312+00	access
937	6	list	decision	\N	Listed decisions	2026-08-02 16:24:24.473631+00	access
938	6	list	decision	\N	Listed decisions	2026-08-02 16:24:27.283512+00	access
939	6	list	decision	\N	Listed decisions	2026-08-02 16:24:36.492641+00	access
940	6	update_role	user	21	Admin updated role of user reviewer.tech@example.com from employee to reviewer	2026-08-02 16:25:30.118319+00	security
941	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-02 16:42:48.603415+00	security
942	6	list	decision	\N	Listed decisions	2026-08-02 16:50:15.838976+00	access
943	6	list	decision	\N	Listed decisions	2026-08-02 16:50:29.799019+00	access
944	6	delete	decision	51	Deleted decision: Adopt New Project Management Tool	2026-08-02 16:52:52.833971+00	activity
945	6	create	decision	52	Created decision: Adopt New Project Management Tool	2026-08-02 16:52:56.214296+00	activity
946	6	view	decision	52	Viewed decision: Adopt New Project Management Tool	2026-08-02 16:54:00.988554+00	access
947	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-03 12:05:13.099297+00	security
948	6	list	user	\N	Admin listed all users	2026-08-03 12:06:58.239875+00	access
949	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-03 12:29:35.046002+00	security
950	21	login	user	21	User logged in successfully: reviewer.tech@example.com	2026-08-03 12:35:30.987039+00	security
951	21	list	decision	\N	Listed decisions	2026-08-03 12:35:34.656397+00	access
952	21	list	decision	\N	Listed decisions	2026-08-03 12:35:45.135557+00	access
953	21	list	decision	\N	Listed decisions	2026-08-03 12:35:55.516216+00	access
954	21	list	decision	\N	Listed decisions	2026-08-03 12:35:55.716319+00	access
955	21	list	decision	\N	Listed decisions	2026-08-03 12:36:10.080056+00	access
956	21	list	decision	\N	Listed decisions	2026-08-03 12:36:19.43489+00	access
957	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 12:36:27.769951+00	access
958	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 12:36:29.461047+00	access
959	21	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 12:36:30.79552+00	access
960	21	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 12:36:33.526023+00	access
961	21	approve	decision	52	Approved decision 52 with comment: 	2026-08-03 12:36:52.941042+00	activity
962	21	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 12:37:17.444896+00	access
963	21	view	decision	52	Viewed decision: Adopt New Project Management Tool	2026-08-03 12:37:17.444982+00	access
964	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-03 12:39:48.593124+00	security
965	16	list	decision	\N	Listed decisions	2026-08-03 12:39:49.595275+00	access
966	16	list	decision	\N	Listed decisions	2026-08-03 12:39:52.144981+00	access
967	16	list	decision	\N	Listed decisions	2026-08-03 12:39:54.464372+00	access
968	16	list	decision	\N	Listed decisions	2026-08-03 12:39:57.316465+00	access
969	16	list	decision	\N	Listed decisions	2026-08-03 12:44:38.510517+00	access
970	16	list	decision	\N	Listed decisions	2026-08-03 12:44:40.79974+00	access
971	16	list	decision	\N	Listed decisions	2026-08-03 12:54:45.303891+00	access
972	16	list	decision	\N	Listed decisions	2026-08-03 12:54:47.550339+00	access
973	16	list	decision	\N	Listed decisions	2026-08-03 12:54:50.31346+00	access
974	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-03 13:04:58.999967+00	security
975	4	list	decision	\N	Listed decisions	2026-08-03 13:05:01.408674+00	access
976	4	list	decision	\N	Listed decisions	2026-08-03 13:05:05.468683+00	access
977	4	list	decision	\N	Listed decisions	2026-08-03 13:05:10.065909+00	access
978	4	list	decision	\N	Listed decisions	2026-08-03 13:05:14.919504+00	access
979	4	list	decision	\N	Listed decisions	2026-08-03 13:05:18.744866+00	access
980	4	list	decision	\N	Listed decisions	2026-08-03 13:05:22.894134+00	access
981	4	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:06:18.765933+00	access
982	4	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:06:19.42884+00	access
983	4	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:06:21.125839+00	access
984	4	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:06:21.823742+00	access
985	4	approve	decision	54	Approved decision 54 with comment: 	2026-08-03 13:06:26.625894+00	activity
986	4	view	decision	54	Viewed decision: test 2 	2026-08-03 13:06:36.813685+00	access
987	4	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:06:36.804092+00	access
988	4	list	decision	\N	Listed decisions	2026-08-03 13:10:37.77929+00	access
989	4	list	decision	\N	Listed decisions	2026-08-03 13:10:42.606381+00	access
990	4	view_discussion	decision	53	Viewed discussion thread for decision 53	2026-08-03 13:11:00.764179+00	access
991	4	view_discussion	decision	53	Viewed discussion thread for decision 53	2026-08-03 13:11:01.52586+00	access
992	4	view_approvals	decision	53	Viewed approvals for decision 53	2026-08-03 13:11:02.544125+00	access
993	4	view_approvals	decision	53	Viewed approvals for decision 53	2026-08-03 13:11:03.286482+00	access
994	4	approve	decision	53	Approved decision 53 with comment: 	2026-08-03 13:11:05.484224+00	activity
995	4	view	decision	53	Viewed decision: test decision	2026-08-03 13:11:15.466062+00	access
996	4	view_approvals	decision	53	Viewed approvals for decision 53	2026-08-03 13:11:15.465043+00	access
997	4	list	decision	\N	Listed decisions	2026-08-03 13:11:24.246144+00	access
998	4	list	decision	\N	Listed decisions	2026-08-03 13:11:29.163657+00	access
999	16	list	decision	\N	Listed decisions	2026-08-03 13:12:08.028633+00	access
1000	16	list	decision	\N	Listed decisions	2026-08-03 13:18:27.481513+00	access
1001	16	list	decision	\N	Listed decisions	2026-08-03 13:18:29.751505+00	access
1002	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-03 13:19:02.639831+00	security
1003	6	list	user	\N	Admin listed all users	2026-08-03 13:19:03.316748+00	access
1004	6	list	decision	\N	Listed decisions	2026-08-03 13:19:03.186328+00	access
1005	6	list	user	\N	Admin listed all users	2026-08-03 13:19:05.046962+00	access
1006	6	list	decision	\N	Listed decisions	2026-08-03 13:19:05.723903+00	access
1007	6	list	decision	\N	Listed decisions	2026-08-03 13:19:08.885302+00	access
1008	6	list	decision	\N	Listed decisions	2026-08-03 13:19:11.36659+00	access
1009	6	list	decision	\N	Listed decisions	2026-08-03 13:19:17.133053+00	access
1010	6	list	decision	\N	Listed decisions	2026-08-03 13:19:20.397045+00	access
1011	6	update_status	decision	49	Updated status of decision 49 from draft to under_review	2026-08-03 13:19:31.383007+00	activity
1012	6	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:19:34.515937+00	access
1013	6	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:19:35.100049+00	access
1014	6	update_status	decision	49	Updated status of decision 49 from under_review to archived	2026-08-03 13:19:41.676428+00	activity
1015	6	update_status	decision	49	Updated status of decision 49 from archived to draft	2026-08-03 13:19:43.725977+00	activity
1016	6	update_status	decision	49	Updated status of decision 49 from draft to under_review	2026-08-03 13:19:45.779061+00	activity
1017	6	list	decision	\N	Listed decisions	2026-08-03 13:19:48.820379+00	access
1018	6	list	decision	\N	Listed decisions	2026-08-03 13:19:51.084826+00	access
1019	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-03 13:20:29.28078+00	security
1020	16	list	decision	\N	Listed decisions	2026-08-03 13:20:29.817378+00	access
1021	16	list	decision	\N	Listed decisions	2026-08-03 13:20:32.577885+00	access
1022	16	list	decision	\N	Listed decisions	2026-08-03 13:20:35.672557+00	access
1023	16	list	decision	\N	Listed decisions	2026-08-03 13:20:38.059337+00	access
1028	4	list	decision	\N	Listed decisions	2026-08-03 13:21:33.46667+00	access
1035	4	list_alternatives	decision	49	Viewed alternatives list for decision 49	2026-08-03 13:21:52.937928+00	access
1043	4	list	decision	\N	Listed decisions	2026-08-03 13:22:04.111245+00	access
1045	4	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-03 13:22:07.651706+00	access
1063	16	login	user	16	User logged in successfully: apoorva22@gmail.com	2026-08-03 13:22:46.730508+00	security
1070	16	list	decision	\N	Listed decisions	2026-08-03 13:23:00.290788+00	access
1313	4	list	decision	\N	Listed decisions	2026-08-04 13:34:34.278858+00	access
1316	21	list	decision	\N	Listed decisions	2026-08-04 13:35:08.364444+00	access
1630	6	list	decision	\N	Listed decisions	2026-08-14 04:57:17.624135+00	access
1646	6	list	decision	\N	Listed decisions	2026-08-14 05:38:01.703918+00	access
1648	6	list	decision	\N	Listed decisions	2026-08-14 05:42:00.260762+00	access
1706	6	login	user	6	User logged in successfully	2026-08-14 13:18:00.505913+00	security
1711	6	list	decision	\N	Listed decisions	2026-08-14 13:20:01.251781+00	access
1737	6	list	decision	\N	Listed decisions	2026-08-14 16:19:56.328862+00	access
1738	6	list	decision	\N	Listed decisions	2026-08-14 16:21:06.375156+00	access
1783	7	list	decision	\N	Listed decisions	2026-08-15 10:55:27.312206+00	access
1785	7	list	decision	\N	Listed decisions	2026-08-15 10:55:36.272332+00	access
1787	7	list	decision	\N	Listed decisions	2026-08-15 10:55:50.187827+00	access
1826	6	login	user	6	User logged in successfully	2026-08-15 13:32:04.284343+00	security
1843	6	list	decision	\N	Listed decisions	2026-08-15 15:29:41.39448+00	access
1885	7	list	decision	\N	Listed decisions	2026-08-15 18:16:15.042474+00	access
1919	7	list	decision	\N	Listed decisions	2026-08-15 19:14:17.249124+00	access
1990	4	login	user	4	User logged in successfully	2026-08-16 13:10:15.759924+00	security
2050	17	list	decision	\N	Listed decisions	2026-08-16 14:31:11.400456+00	access
1024	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-03 13:21:24.615364+00	security
1026	4	list	decision	\N	Listed decisions	2026-08-03 13:21:27.99036+00	access
1031	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:21:45.133425+00	access
1033	4	view_versions	decision	49	Viewed versions for decision 49	2026-08-03 13:21:48.009776+00	access
1039	4	list	decision	\N	Listed decisions	2026-08-03 13:21:58.188519+00	access
1047	4	list	decision	\N	Listed decisions	2026-08-03 13:22:09.346622+00	access
1069	16	list	decision	\N	Listed decisions	2026-08-03 13:22:55.304903+00	access
1073	16	list	decision	\N	Listed decisions	2026-08-03 13:27:00.07558+00	access
1315	21	list	decision	\N	Listed decisions	2026-08-04 13:34:58.457781+00	access
1631	6	list	decision	\N	Listed decisions	2026-08-14 04:57:22.860976+00	access
1647	6	list	decision	\N	Listed decisions	2026-08-14 05:42:01.243688+00	access
1707	6	list	decision	\N	Listed decisions	2026-08-14 13:18:03.677442+00	access
1739	6	list	decision	\N	Listed decisions	2026-08-14 16:21:20.197308+00	access
1789	7	list	decision	\N	Listed decisions	2026-08-15 10:58:15.086354+00	access
1791	7	list	decision	\N	Listed decisions	2026-08-15 10:58:48.965849+00	access
1801	5	list	decision	\N	Listed decisions	2026-08-15 11:01:22.930542+00	access
1802	5	list	decision	\N	Listed decisions	2026-08-15 11:01:23.791185+00	access
1805	5	list	decision	\N	Listed decisions	2026-08-15 11:01:40.625467+00	access
1827	6	list	decision	\N	Listed decisions	2026-08-15 13:32:09.905181+00	access
1829	6	list	decision	\N	Listed decisions	2026-08-15 13:32:12.370205+00	access
1844	6	list	decision	\N	Listed decisions	2026-08-15 15:29:39.243903+00	access
1889	7	login	user	7	User logged in successfully	2026-08-15 18:27:43.173849+00	security
1890	7	list	decision	\N	Listed decisions	2026-08-15 18:28:10.114684+00	access
1991	4	list	decision	\N	Listed decisions	2026-08-16 13:11:10.12198+00	access
2051	17	list	decision	\N	Listed decisions	2026-08-16 14:31:13.100909+00	access
2054	17	list	decision	\N	Listed decisions	2026-08-16 14:31:18.595536+00	access
1025	4	list	decision	\N	Listed decisions	2026-08-03 13:21:25.204733+00	access
1030	4	list	decision	\N	Listed decisions	2026-08-03 13:21:38.770802+00	access
1032	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:21:45.696082+00	access
1038	4	list	decision	\N	Listed decisions	2026-08-03 13:21:55.370303+00	access
1049	4	list	decision	\N	Listed decisions	2026-08-03 13:22:11.743733+00	access
1067	16	list	decision	\N	Listed decisions	2026-08-03 13:22:49.821843+00	access
1632	6	list	decision	\N	Listed decisions	2026-08-14 05:04:03.719733+00	access
1649	6	list	decision	\N	Listed decisions	2026-08-14 05:42:02.251043+00	access
1708	6	list	decision	\N	Listed decisions	2026-08-14 13:18:02.757759+00	access
1712	6	list	decision	\N	Listed decisions	2026-08-14 13:20:02.463291+00	access
1740	6	list	decision	\N	Listed decisions	2026-08-14 16:25:39.851729+00	access
1790	7	list	decision	\N	Listed decisions	2026-08-15 10:58:40.995854+00	access
1792	7	list	decision	\N	Listed decisions	2026-08-15 10:59:16.605874+00	access
1794	7	list	decision	\N	Listed decisions	2026-08-15 11:00:07.375794+00	access
1800	5	login	user	5	User logged in successfully	2026-08-15 11:01:21.585782+00	security
1828	6	list	decision	\N	Listed decisions	2026-08-15 13:32:07.671175+00	access
1845	6	list	decision	\N	Listed decisions	2026-08-15 15:29:43.149378+00	access
1891	7	list	decision	\N	Listed decisions	2026-08-15 18:34:47.915147+00	access
1992	21	list	decision	\N	Listed decisions	2026-08-16 13:18:42.617827+00	access
1993	21	list	decision	\N	Listed decisions	2026-08-16 13:18:52.753948+00	access
1994	21	list	decision	\N	Listed decisions	2026-08-16 13:19:53.473543+00	access
2004	21	list	decision	\N	Listed decisions	2026-08-16 13:20:06.728491+00	access
1027	4	list	decision	\N	Listed decisions	2026-08-03 13:21:31.100013+00	access
1034	4	view_versions	decision	49	Viewed versions for decision 49	2026-08-03 13:21:48.571422+00	access
1041	4	list	decision	\N	Listed decisions	2026-08-03 13:22:01.449791+00	access
1044	4	view_discussion	decision	50	Viewed discussion thread for decision 50	2026-08-03 13:22:07.211022+00	access
1056	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-08-03 13:22:25.14776+00	access
1059	4	list	decision	\N	Listed decisions	2026-08-03 13:22:33.581499+00	access
1065	16	list	decision	\N	Listed decisions	2026-08-03 13:22:47.393061+00	access
1071	16	list	decision	\N	Listed decisions	2026-08-03 13:23:03.626573+00	access
1633	6	list	decision	\N	Listed decisions	2026-08-14 05:04:04.433206+00	access
1650	6	list	decision	\N	Listed decisions	2026-08-14 05:42:07.278228+00	access
1709	6	list	decision	\N	Listed decisions	2026-08-14 13:18:04.712156+00	access
1713	6	list	decision	\N	Listed decisions	2026-08-14 13:20:00.827125+00	access
1741	6	list	decision	\N	Listed decisions	2026-08-14 16:25:38.860856+00	access
1743	6	list	decision	\N	Listed decisions	2026-08-14 16:25:50.627919+00	access
1795	7	list	decision	\N	Listed decisions	2026-08-15 11:00:07.065395+00	access
1797	7	list	decision	\N	Listed decisions	2026-08-15 11:00:14.865514+00	access
1799	7	list	decision	\N	Listed decisions	2026-08-15 11:00:30.730272+00	access
1830	6	list	decision	\N	Listed decisions	2026-08-15 13:32:24.58004+00	access
1846	6	list	decision	\N	Listed decisions	2026-08-15 15:29:51.555804+00	access
1892	7	list	decision	\N	Listed decisions	2026-08-15 18:39:24.959541+00	access
1898	7	list	decision	\N	Listed decisions	2026-08-15 18:39:32.899598+00	access
1995	21	list	decision	\N	Listed decisions	2026-08-16 13:19:55.023799+00	access
2000	21	list	decision	\N	Listed decisions	2026-08-16 13:20:00.973908+00	access
2012	21	list	decision	\N	Listed decisions	2026-08-16 13:22:33.758903+00	access
2016	21	list	decision	\N	Listed decisions	2026-08-16 13:22:54.953844+00	access
1029	4	list	decision	\N	Listed decisions	2026-08-03 13:21:36.02347+00	access
1036	4	list_alternatives	decision	49	Viewed alternatives list for decision 49	2026-08-03 13:21:53.432269+00	access
1037	4	list	decision	\N	Listed decisions	2026-08-03 13:21:54.794351+00	access
1040	4	list	decision	\N	Listed decisions	2026-08-03 13:21:58.95059+00	access
1042	4	list	decision	\N	Listed decisions	2026-08-03 13:22:03.208779+00	access
1046	4	list	decision	\N	Listed decisions	2026-08-03 13:22:07.104917+00	access
1048	4	list	decision	\N	Listed decisions	2026-08-03 13:22:11.389088+00	access
1050	4	list	decision	\N	Listed decisions	2026-08-03 13:22:15.159849+00	access
1051	4	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:22:20.890533+00	access
1052	4	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:22:21.624822+00	access
1053	4	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:22:23.785112+00	access
1054	4	view_discussion	decision	35	Viewed discussion thread for decision 35	2026-08-03 13:22:24.629803+00	access
1055	4	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:22:24.679503+00	access
1057	4	list	decision	\N	Listed decisions	2026-08-03 13:22:30.104877+00	access
1058	4	list	decision	\N	Listed decisions	2026-08-03 13:22:30.882338+00	access
1060	4	list	decision	\N	Listed decisions	2026-08-03 13:22:34.194338+00	access
1061	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:22:44.925843+00	access
1062	4	view_discussion	decision	49	Viewed discussion thread for decision 49	2026-08-03 13:22:45.844264+00	access
1064	4	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-03 13:22:47.023841+00	access
1066	4	view_approvals	decision	49	Viewed approvals for decision 49	2026-08-03 13:22:47.70962+00	access
1068	16	list	decision	\N	Listed decisions	2026-08-03 13:22:52.602834+00	access
1072	16	list	decision	\N	Listed decisions	2026-08-03 13:26:57.272759+00	access
1074	4	list	decision	\N	Listed decisions	2026-08-03 13:29:45.26012+00	access
1075	4	list	decision	\N	Listed decisions	2026-08-03 13:29:50.804745+00	access
1076	4	list	decision	\N	Listed decisions	2026-08-03 13:29:55.513657+00	access
1077	21	login	user	21	User logged in successfully: reviewer.tech@example.com	2026-08-03 13:29:57.684951+00	security
1078	4	list	decision	\N	Listed decisions	2026-08-03 13:29:59.794119+00	access
1079	21	list	decision	\N	Listed decisions	2026-08-03 13:30:04.604964+00	access
1080	21	list	decision	\N	Listed decisions	2026-08-03 13:30:09.443838+00	access
1081	21	list	decision	\N	Listed decisions	2026-08-03 13:30:13.889398+00	access
1082	21	list	decision	\N	Listed decisions	2026-08-03 13:30:18.613833+00	access
1083	21	list	decision	\N	Listed decisions	2026-08-03 13:30:23.089557+00	access
1084	21	list	decision	\N	Listed decisions	2026-08-03 13:30:23.500043+00	access
1085	21	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:33:17.083759+00	access
1086	21	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:33:17.903825+00	access
1087	21	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:33:18.599726+00	access
1088	21	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:33:19.578894+00	access
1089	21	list	decision	\N	Listed decisions	2026-08-03 13:33:23.349371+00	access
1090	21	list	decision	\N	Listed decisions	2026-08-03 13:33:27.494212+00	access
1091	21	view_discussion	decision	28	Viewed discussion thread for decision 28	2026-08-03 13:33:37.138171+00	access
1092	21	view_discussion	decision	28	Viewed discussion thread for decision 28	2026-08-03 13:33:38.094913+00	access
1093	21	view_approvals	decision	28	Viewed approvals for decision 28	2026-08-03 13:33:39.564369+00	access
1094	21	view_approvals	decision	28	Viewed approvals for decision 28	2026-08-03 13:33:40.555171+00	access
1095	21	approve	decision	28	Approved decision 28 with comment: Good	2026-08-03 13:36:42.569087+00	activity
1096	21	view_approvals	decision	28	Viewed approvals for decision 28	2026-08-03 13:36:53.726488+00	access
1097	21	view	decision	28	Viewed decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	2026-08-03 13:36:53.746973+00	access
1098	21	list	decision	\N	Listed decisions	2026-08-03 13:37:01.884329+00	access
1099	21	list	decision	\N	Listed decisions	2026-08-03 13:37:06.337512+00	access
1100	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:44:41.774192+00	access
1101	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:44:42.517017+00	access
1102	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:44:49.052404+00	access
1103	21	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:44:49.814584+00	access
1104	21	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:44:51.131835+00	access
1105	21	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:44:54.17612+00	access
1106	21	list	decision	\N	Listed decisions	2026-08-03 13:45:01.261838+00	access
1107	21	list	decision	\N	Listed decisions	2026-08-03 13:45:05.648381+00	access
1108	21	list	decision	\N	Listed decisions	2026-08-03 13:45:11.582325+00	access
1109	21	list	decision	\N	Listed decisions	2026-08-03 13:45:17.06118+00	access
1110	5	login	user	5	User logged in successfully: manager.test@example.com	2026-08-03 13:45:22.471426+00	security
1111	5	list	decision	\N	Listed decisions	2026-08-03 13:45:24.329617+00	access
1112	5	list	decision	\N	Listed decisions	2026-08-03 13:45:29.597312+00	access
1113	5	list	decision	\N	Listed decisions	2026-08-03 13:45:35.039145+00	access
1114	5	list	decision	\N	Listed decisions	2026-08-03 13:45:39.236911+00	access
1115	5	list	decision	\N	Listed decisions	2026-08-03 13:45:46.00703+00	access
1116	5	list	decision	\N	Listed decisions	2026-08-03 13:45:50.821138+00	access
1117	5	list	decision	\N	Listed decisions	2026-08-03 13:45:55.412426+00	access
1118	5	list	decision	\N	Listed decisions	2026-08-03 13:46:01.041462+00	access
1119	5	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:46:31.316993+00	access
1120	5	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-03 13:46:32.451828+00	access
1121	5	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:46:33.077049+00	access
1122	5	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-03 13:46:34.43626+00	access
1123	5	list	decision	\N	Listed decisions	2026-08-03 13:46:57.636196+00	access
1124	5	list	decision	\N	Listed decisions	2026-08-03 13:47:02.591963+00	access
1125	5	view_discussion	decision	53	Viewed discussion thread for decision 53	2026-08-03 13:47:05.414246+00	access
1126	5	view_discussion	decision	53	Viewed discussion thread for decision 53	2026-08-03 13:47:06.117017+00	access
1127	5	view_approvals	decision	53	Viewed approvals for decision 53	2026-08-03 13:47:07.111826+00	access
1128	5	view_approvals	decision	53	Viewed approvals for decision 53	2026-08-03 13:47:08.121798+00	access
1129	5	list	decision	\N	Listed decisions	2026-08-03 13:47:14.631302+00	access
1130	5	list	decision	\N	Listed decisions	2026-08-03 13:47:19.449162+00	access
1132	5	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:47:23.65009+00	access
1133	5	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:47:25.284263+00	access
1135	5	reject	decision	52	Rejected decision 52 with comment: Implement completely	2026-08-03 13:48:04.889916+00	activity
1143	6	list	decision	\N	Listed decisions	2026-08-03 13:48:58.529757+00	access
1150	6	list	decision	\N	Listed decisions	2026-08-03 13:49:23.364932+00	access
1152	6	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:49:26.174176+00	access
1154	6	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:49:29.629875+00	access
1634	6	list	decision	\N	Listed decisions	2026-08-14 05:04:03.207031+00	access
1651	6	list	decision	\N	Listed decisions	2026-08-14 05:43:03.278941+00	access
1710	6	list	decision	\N	Listed decisions	2026-08-14 13:18:09.512144+00	access
1742	6	list	decision	\N	Listed decisions	2026-08-14 16:25:41.33152+00	access
1744	6	list	decision	\N	Listed decisions	2026-08-14 16:26:00.676209+00	access
1796	7	list	decision	\N	Listed decisions	2026-08-15 11:00:10.642215+00	access
1798	7	list	decision	\N	Listed decisions	2026-08-15 11:00:22.227088+00	access
1804	5	list	decision	\N	Listed decisions	2026-08-15 11:01:30.707077+00	access
1806	5	list	decision	\N	Listed decisions	2026-08-15 11:01:46.277123+00	access
1831	6	list	decision	\N	Listed decisions	2026-08-15 13:32:44.630335+00	access
1847	7	login	user	7	User logged in successfully	2026-08-15 15:36:25.341656+00	security
1893	7	list	decision	\N	Listed decisions	2026-08-15 18:39:24.364794+00	access
1895	7	list	decision	\N	Listed decisions	2026-08-15 18:39:27.299944+00	access
1996	21	list	decision	\N	Listed decisions	2026-08-16 13:19:56.362653+00	access
2002	21	list	decision	\N	Listed decisions	2026-08-16 13:20:02.628257+00	access
2011	21	list	decision	\N	Listed decisions	2026-08-16 13:22:33.757599+00	access
2022	21	list	decision	\N	Listed decisions	2026-08-16 13:24:32.622424+00	access
1131	5	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:47:22.891877+00	access
1134	5	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:47:26.176897+00	access
1139	5	list	decision	\N	Listed decisions	2026-08-03 13:48:41.281973+00	access
1145	6	list	user	\N	Admin listed all users	2026-08-03 13:49:03.9619+00	access
1147	6	list	decision	\N	Listed decisions	2026-08-03 13:49:11.107796+00	access
1149	6	list	decision	\N	Listed decisions	2026-08-03 13:49:19.106888+00	access
1652	6	list	decision	\N	Listed decisions	2026-08-14 05:43:10.95785+00	access
1714	6	list	decision	\N	Listed decisions	2026-08-14 13:20:09.213179+00	access
1745	6	list	decision	\N	Listed decisions	2026-08-14 16:26:01.798921+00	access
1803	5	list	decision	\N	Listed decisions	2026-08-15 11:01:22.610846+00	access
1832	6	list	decision	\N	Listed decisions	2026-08-15 13:33:03.388635+00	access
1848	7	list	decision	\N	Listed decisions	2026-08-15 15:36:28.998106+00	access
1852	7	list	decision	\N	Listed decisions	2026-08-15 15:36:54.357856+00	access
1894	7	list	decision	\N	Listed decisions	2026-08-15 18:39:27.299852+00	access
1897	7	list	decision	\N	Listed decisions	2026-08-15 18:39:30.9748+00	access
1899	7	list	decision	\N	Listed decisions	2026-08-15 18:39:33.929832+00	access
1997	21	list	decision	\N	Listed decisions	2026-08-16 13:19:56.353311+00	access
1136	5	view	decision	52	Viewed decision: Adopt New Project Management Tool	2026-08-03 13:48:15.077085+00	access
1138	5	list	decision	\N	Listed decisions	2026-08-03 13:48:36.632317+00	access
1141	5	list	decision	\N	Listed decisions	2026-08-03 13:48:50.647014+00	access
1148	6	list	decision	\N	Listed decisions	2026-08-03 13:49:15.236856+00	access
1151	6	view_discussion	decision	52	Viewed discussion thread for decision 52	2026-08-03 13:49:25.432628+00	access
1153	6	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:49:28.457467+00	access
1653	6	list	decision	\N	Listed decisions	2026-08-14 05:58:01.509122+00	access
1655	6	list	decision	\N	Listed decisions	2026-08-14 05:58:02.089278+00	access
1715	6	list	decision	\N	Listed decisions	2026-08-14 13:27:50.499578+00	access
1718	6	list	decision	\N	Listed decisions	2026-08-14 13:27:55.798468+00	access
1723	6	list	decision	\N	Listed decisions	2026-08-14 13:31:05.852871+00	access
1746	6	list	decision	\N	Listed decisions	2026-08-14 16:35:03.082838+00	access
1807	5	list	decision	\N	Listed decisions	2026-08-15 11:35:09.401+00	access
1810	5	list	decision	\N	Listed decisions	2026-08-15 11:35:17.275873+00	access
1849	7	list	decision	\N	Listed decisions	2026-08-15 15:36:27.755315+00	access
1851	7	list	decision	\N	Listed decisions	2026-08-15 15:36:41.808655+00	access
1853	7	list	decision	\N	Listed decisions	2026-08-15 15:37:07.255883+00	access
1896	7	list	decision	\N	Listed decisions	2026-08-15 18:39:29.729181+00	access
1998	21	list	decision	\N	Listed decisions	2026-08-16 13:19:56.352307+00	access
2003	21	list	decision	\N	Listed decisions	2026-08-16 13:20:05.467521+00	access
2005	21	list	decision	\N	Listed decisions	2026-08-16 13:20:08.999275+00	access
2007	21	list	decision	\N	Listed decisions	2026-08-16 13:22:15.292195+00	access
2009	21	list	decision	\N	Listed decisions	2026-08-16 13:22:33.748455+00	access
2015	21	list	decision	\N	Listed decisions	2026-08-16 13:22:39.382338+00	access
2017	21	list	decision	\N	Listed decisions	2026-08-16 13:23:09.407314+00	access
2018	21	list	decision	\N	Listed decisions	2026-08-16 13:24:13.778038+00	access
2021	21	list	decision	\N	Listed decisions	2026-08-16 13:24:24.542716+00	access
1137	5	view_approvals	decision	52	Viewed approvals for decision 52	2026-08-03 13:48:15.07624+00	access
1140	5	list	decision	\N	Listed decisions	2026-08-03 13:48:45.531345+00	access
1142	6	login	user	6	User logged in successfully: admin.test@example.com	2026-08-03 13:48:57.062489+00	security
1144	6	list	user	\N	Admin listed all users	2026-08-03 13:48:59.555771+00	access
1146	6	list	decision	\N	Listed decisions	2026-08-03 13:49:06.770564+00	access
1155	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-04 11:24:40.64982+00	security
1156	11	list	user	\N	Admin listed all users	2026-08-04 11:24:42.438833+00	access
1157	11	list	decision	\N	Listed decisions	2026-08-04 11:24:42.237875+00	access
1158	11	list	user	\N	Admin listed all users	2026-08-04 11:24:44.301543+00	access
1159	11	list	decision	\N	Listed decisions	2026-08-04 11:24:45.50863+00	access
1160	11	list	decision	\N	Listed decisions	2026-08-04 11:24:50.442152+00	access
1161	11	list	decision	\N	Listed decisions	2026-08-04 11:24:56.643538+00	access
1162	11	list	decision	\N	Listed decisions	2026-08-04 11:38:42.544192+00	access
1163	11	login	user	11	User logged in successfully: sahithi@gmail.com	2026-08-04 11:45:23.715167+00	security
1164	11	list	user	\N	Admin listed all users	2026-08-04 11:45:25.37664+00	access
1165	11	list	decision	\N	Listed decisions	2026-08-04 11:45:25.171216+00	access
1166	11	list	user	\N	Admin listed all users	2026-08-04 11:45:27.132188+00	access
1167	11	list	decision	\N	Listed decisions	2026-08-04 11:45:28.034146+00	access
1168	11	list	decision	\N	Listed decisions	2026-08-04 11:45:31.68848+00	access
1169	11	list	decision	\N	Listed decisions	2026-08-04 11:45:34.726962+00	access
1170	11	list	decision	\N	Listed decisions	2026-08-04 11:45:38.203421+00	access
1171	11	list	decision	\N	Listed decisions	2026-08-04 11:45:41.144005+00	access
1172	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-04 11:45:44.559912+00	access
1173	11	view_discussion	decision	54	Viewed discussion thread for decision 54	2026-08-04 11:45:45.081461+00	access
1174	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 11:45:47.454217+00	access
1175	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 11:45:47.954115+00	access
1176	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 11:45:48.70295+00	access
1177	11	view_approvals	decision	54	Viewed approvals for decision 54	2026-08-04 11:45:49.406321+00	access
1178	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 11:45:57.920983+00	access
1179	11	view_versions	decision	54	Viewed versions for decision 54	2026-08-04 11:45:58.486474+00	access
1180	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-04 11:46:00.565692+00	access
1181	11	list_alternatives	decision	54	Viewed alternatives list for decision 54	2026-08-04 11:46:01.337076+00	access
1182	11	list	decision	\N	Listed decisions	2026-08-04 11:46:53.781099+00	access
1183	11	list	decision	\N	Listed decisions	2026-08-04 11:46:56.721787+00	access
1184	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 12:12:33.736436+00	security
1185	11	list	decision	\N	Listed decisions	2026-08-04 12:14:13.177619+00	access
1186	11	list	decision	\N	Listed decisions	2026-08-04 12:14:18.465217+00	access
1187	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 12:28:50.775517+00	security
1188	7	create	discussion_message	35	Created comment for decision 31	2026-08-04 12:31:49.740729+00	activity
1189	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 13:03:03.041872+00	security
1190	7	login	user	7	User logged in successfully: employee.test@example.com	2026-08-04 13:03:13.332008+00	security
1191	7	list	decision	\N	Listed decisions	2026-08-04 13:03:16.028647+00	access
1192	7	list	decision	\N	Listed decisions	2026-08-04 13:03:17.268514+00	access
1193	7	list	decision	\N	Listed decisions	2026-08-04 13:03:22.487776+00	access
1194	7	list	decision	\N	Listed decisions	2026-08-04 13:03:24.846166+00	access
1195	7	list	decision	\N	Listed decisions	2026-08-04 13:03:26.585768+00	access
1196	7	list	decision	\N	Listed decisions	2026-08-04 13:03:30.847462+00	access
1197	7	list	decision	\N	Listed decisions	2026-08-04 13:03:33.246192+00	access
1198	7	list	decision	\N	Listed decisions	2026-08-04 13:03:41.772506+00	access
1199	7	list	decision	\N	Listed decisions	2026-08-04 13:06:49.669574+00	access
1200	7	list	decision	\N	Listed decisions	2026-08-04 13:06:52.365751+00	access
1201	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-08-04 13:06:58.460145+00	access
1202	7	view_discussion	decision	31	Viewed discussion thread for decision 31	2026-08-04 13:06:59.739965+00	access
1203	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-08-04 13:07:00.12542+00	access
1204	7	view_approvals	decision	31	Viewed approvals for decision 31	2026-08-04 13:07:02.767728+00	access
1205	7	list	decision	\N	Listed decisions	2026-08-04 13:10:06.207307+00	access
1206	7	list	decision	\N	Listed decisions	2026-08-04 13:10:05.645326+00	access
1207	7	list	decision	\N	Listed decisions	2026-08-04 13:10:09.567768+00	access
1208	7	list	decision	\N	Listed decisions	2026-08-04 13:10:12.448392+00	access
1209	4	login	user	4	User logged in successfully: reviewer.test@example.com	2026-08-04 13:10:20.042298+00	security
1210	4	list	decision	\N	Listed decisions	2026-08-04 13:10:21.015051+00	access
1211	4	list	decision	\N	Listed decisions	2026-08-04 13:10:22.208749+00	access
1212	4	list	decision	\N	Listed decisions	2026-08-04 13:10:23.257477+00	access
1213	4	list	decision	\N	Listed decisions	2026-08-04 13:10:23.889635+00	access
1214	4	list	decision	\N	Listed decisions	2026-08-04 13:10:24.76732+00	access
1215	4	list	decision	\N	Listed decisions	2026-08-04 13:10:25.664942+00	access
1216	4	list	decision	\N	Listed decisions	2026-08-04 13:10:36.950079+00	access
1217	4	list	decision	\N	Listed decisions	2026-08-04 13:10:37.891107+00	access
1218	4	list	decision	\N	Listed decisions	2026-08-04 13:10:36.693726+00	access
1219	4	list	decision	\N	Listed decisions	2026-08-04 13:10:39.330094+00	access
1220	4	list	decision	\N	Listed decisions	2026-08-04 13:10:39.978769+00	access
1221	4	list	decision	\N	Listed decisions	2026-08-04 13:10:42.687402+00	access
1222	21	login	user	21	User logged in successfully: reviewer.tech@example.com	2026-08-04 13:10:56.927645+00	security
1223	21	list	decision	\N	Listed decisions	2026-08-04 13:10:59.339372+00	access
1224	21	list	decision	\N	Listed decisions	2026-08-04 13:10:58.060287+00	access
1225	21	list	decision	\N	Listed decisions	2026-08-04 13:11:00.350063+00	access
1226	21	list	decision	\N	Listed decisions	2026-08-04 13:11:01.494018+00	access
1227	21	list	decision	\N	Listed decisions	2026-08-04 13:11:02.445054+00	access
1654	6	list	decision	\N	Listed decisions	2026-08-14 05:58:00.580129+00	access
1716	6	list	decision	\N	Listed decisions	2026-08-14 13:27:49.752203+00	access
1747	6	list	decision	\N	Listed decisions	2026-08-14 16:35:20.304168+00	access
1749	6	list	decision	\N	Listed decisions	2026-08-14 16:35:43.963647+00	access
1808	5	list	decision	\N	Listed decisions	2026-08-15 11:35:10.361357+00	access
1850	7	list	decision	\N	Listed decisions	2026-08-15 15:36:34.836138+00	access
\.


--
-- Data for Name: chat_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_history (id, user_id, decision_id, tab_type, question, answer, created_at) FROM stdin;
1	6	\N	ask	What decisions were approved this week?	Found 0 result(s)	2026-08-15 15:29:53.042373
2	6	\N	ask	why Adopt New Project Management Tool was rejected?	Found 1 result(s)	2026-08-15 15:31:54.166424
3	6	\N	ask	why was Adopt New Project Management Tool rejected?	Found 1 result(s)	2026-08-15 15:53:13.63952
4	7	13	ask	why is this still under review?	The provided information states that the decision is `DecisionStatus.under_review` and that "No approval actions recorded yet," but it does not specify *why* it is still under review.	2026-08-15 16:46:57.451208
5	6	\N	ask	show me all rejected decisions	Found 5 result(s)	2026-08-15 16:53:51.048693
6	6	34	task	Escalate decision 34	escalate: flagged	2026-08-15 16:54:24.519176
\.


--
-- Data for Name: decision_versions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.decision_versions (id, decision_id, version_number, title, problem_statement, category, status, changed_by, created_at) FROM stdin;
1	1	1	Migrate to cloud database	Team members were using separate local databases, making collaboration difficult.	Technical	archived	7	2026-07-23 06:25:25.592201+00
2	1	2	Adopt automated testing pipeline(revised)	Updated: manual testing is slow, error-prone, and doesn't scale as the team grows.	string	archived	7	2026-07-23 06:27:18.555621+00
3	17	1	Automated test	Users are facing issues	Techinacl	draft	7	2026-07-23 06:56:09.398777+00
4	13	1	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-07-23 13:34:36.800069+00
5	13	2	Manual testing is slow	Manual testing is slow and has caused delays in recent releases	Database	draft	7	2026-07-23 13:35:19.095968+00
6	30	1	string	string	string	draft	7	2026-07-27 06:25:52.928447+00
7	30	2	string	string	string	draft	7	2026-07-27 06:28:07.757867+00
8	30	3	string	string	string	draft	7	2026-07-27 06:28:46.370769+00
9	30	4	Automated	manual is slow	technical	draft	7	2026-07-27 06:29:19.54993+00
10	30	5	Automated testing	manual is slow	technical	draft	7	2026-07-27 06:52:53.22565+00
11	31	1	Adopt Automated Testing Pipeline	Our team currently performs testing manually before every release.	Technical	draft	7	2026-07-27 10:22:23.764286+00
12	31	2	Adopt Automated Testing and CI/CD Pipeline	string	string	draft	6	2026-07-27 10:29:07.613443+00
13	31	3	Adopt Automated Testing Pipeline	Our team currently performs testing manually before every release.	Technical	draft	6	2026-07-27 14:04:20.458339+00
14	21	1	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	19	2026-07-29 19:29:11.4465+00
15	31	4	Adopt Automated Testing and CI/CD Pipeline	string	string	rejected	7	2026-07-30 04:18:11.591042+00
16	31	5	Adopt Automated Testing and CI/CD Pipeline	Manual testing is becoming slower, so we need to try to adopt for automated testing.	Technical	rejected	7	2026-07-30 05:42:45.734773+00
17	34	1	Use GitHub for Project Collaboration	Our team needs a common platform to store code and collaborate on the project.	Technical	rejected	7	2026-07-30 12:39:35.258326+00
18	9	1	Migrate to shared cloud database	Team members were each working on separate local PostgreSQL databases, which made it difficult to collaborate, test integrated features, and maintain consistent data across the group project.	Technical	under_review	7	2026-07-30 14:15:34.685327+00
19	49	1	text	text error	technical	draft	16	2026-08-01 12:11:25.705447+00
20	49	2	text	text error	technical	rejected	6	2026-08-08 07:42:43.378951+00
21	78	1	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-15 18:17:37.262597+00
\.


--
-- Data for Name: decisions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.decisions (id, title, problem_statement, category, status, created_by, created_at, updated_at, attachment_url, assigned_reviewer_id, ai_summary, ai_summary_updated_at) FROM stdin;
22	Async Binary File Handling & Collision-Resistant Storage System  	Uploading raw binary files presents challenges around memory overuse, file overwrite collisions, and path-traversal vulnerabilities. Standard synchronous file parsing can block server threads and degrade platform performance. This module addresses these issues by implementing an asynchronous streaming upload pipeline using UploadFile buffering, UUID-based filename sanitization, and structured database relational mapping to guarantee secure storage and quick lookup speeds.	Technical	draft	16	2026-07-23 12:42:41.016779+00	\N	/api/uploads/79a8c060eb3c4e9aa2204089bb0be826.png	\N	\N	\N
13	Automated testing is fast	Manual testing is slow and has caused delays in recent releases\nand now automated testing has become more faster	Database	under_review	7	2026-07-18 09:31:53.383898+00	2026-08-15 10:55:54.64021+00	\N	\N	Manual testing has caused slow release cycles and delays in recent releases. A database optimization meeting discussed composite indexes and decided to add an index on `created_at`.	2026-08-15 10:56:09.475917
14	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-07-18 09:50:49.416433+00	\N	\N	\N	\N	\N
23	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-07-23 16:01:02.21344+00	\N	\N	\N	\N	\N
24	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-07-23 16:02:13.503824+00	\N	\N	\N	\N	\N
27	Audit-Driven Decision Tracking & Contextual Analytics Platform	Our attachment pipeline processes multipart/form-data streams to persist static media files into structured server storage while recording relative static paths (attachment_url), decision context (decision_id), and author metadata (user_id) in relational storage."\n	Technical	draft	16	2026-07-24 11:49:13.668941+00	\N	/api/uploads/5264da0b0854411aa2f9b6f685c7b241.png	\N	\N	\N
28	Audit-Driven Decision Tracking & Contextual Analytics Platform 	"Our attachment pipeline processes multipart/form-data streams to persist static media files into structured server storage while recording relative static paths (attachment_url), decision context (decision_id), and author metadata (user_id) in relational storage."\n\n	Technical	draft	16	2026-07-24 11:56:31.000132+00	\N	/api/uploads/0606e6c7d6c847d88a4e1d4788fcc810.png	\N	\N	\N
29	Audit-Driven Decision Tracking	Our attachment pipeline processes multipart/form-data streams to persist static media files into structured server 	HR	draft	18	2026-07-26 10:33:40.938963+00	\N	/api/uploads/2b9b9cf539b54e5fab5669091d49dd07.pdf	\N	\N	\N
10	Migrate to cloud database	Team members were using separate local databases, making collaboration difficult.	Technical	draft	7	2026-07-16 04:12:21.162647+00	2026-07-18 10:31:13.468192+00	\N	\N	\N	\N
33	test decision	test	testing	approved	19	2026-07-29 21:54:00.536461+00	2026-07-30 14:13:25.598363+00	\N	\N	\N	\N
16	Automated testing	Users are facing issues	technical	draft	6	2026-07-22 13:43:18.949705+00	2026-08-15 14:47:47.455101+00	\N	\N	Users are encountering issues. This problem has not yet been discussed, and no decision has been made.	2026-08-15 14:47:51.761426
11	Test decision via Swagger	Confirming Swagger authorization works correctly after the fix.	Testing	draft	10	2026-07-16 04:41:11.408218+00	2026-07-22 13:38:38.041864+00	\N	\N	\N	\N
18	Adopt new deployment process	Manual deployments are error-prone and slow.	Technical	draft	7	2026-07-23 04:35:17.137002+00	\N	/api/uploads/50eaadcae72c409eb017c4ef9b848385.png	\N	\N	\N
1	Adopt automated testing pipeline(revised)	Updated: manual testing is slow, error-prone, and doesn't scale as the team grows.	Technical	archived	7	2026-07-14 03:15:03.556762+00	2026-07-23 06:27:18.555621+00	\N	\N	\N	\N
17	Adopt automated testing pipeline (v2)	Updated: manual testing is slow and doesn't scale as the team grows. Adding CI/CD would fix this.	Engineering	draft	6	2026-07-22 13:46:30.31177+00	2026-07-23 06:56:09.398777+00	\N	\N	\N	\N
9	Migrate to shared cloud database	Team members were each working on separate local PostgreSQL databases, which made it difficult to collaborate, test integrated features, and maintain consistent data across the group project.	Technical	under_review	7	2026-07-15 12:10:06.434905+00	2026-07-30 14:15:06.609778+00	\N	\N	\N	\N
26	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	approved	7	2026-07-23 16:05:28.447418+00	2026-07-30 07:03:49.862958+00	\N	\N	\N	\N
35	Direct File Association in Decision Workspace	"From the Decision Builder UI, stakeholders can attach PDFs, images, or documents during decision creation or updates, making supporting materials immediately accessible across the team."		under_review	16	2026-07-31 11:13:00.440159+00	2026-07-31 11:18:29.593799+00	\N	\N	\N	\N
31	Adopt Automated Testing and CI/CD Pipeline	We need some resources to make the systems run automatically, so can you provide us some resources.	Technical	draft	7	2026-07-27 10:18:51.998326+00	2026-07-31 13:14:11.008107+00	string	\N	\N	\N
25	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	rejected	7	2026-07-23 16:05:12.749962+00	2026-08-08 07:07:32.855253+00	\N	\N	\N	\N
30	Automated testing	manual is slow	technical	rejected	7	2026-07-27 06:15:03.369266+00	2026-08-08 07:38:04.868865+00	/api/uploads/d7df67aed7a842c684b63abe3746a1ca.png	\N	\N	\N
32	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	20	2026-07-29 12:21:59.820381+00	\N	\N	\N	\N	\N
21	db optimization meet	We need to discuss and document indexes for query speedup.	test	draft	7	2026-07-23 11:55:17.141473+00	2026-07-29 19:29:11.4465+00	null	\N	\N	\N
12	Migrate to cloud database	Team members were using separate local databases, making collaboration difficult.	Technical	archived	7	2026-07-16 12:54:33.42029+00	2026-08-15 09:48:59.601565+00	\N	\N	\N	2026-08-15 09:49:06.176989
34	Use GitHub for Project Collaboration	Our team needs a common platform to store code and collaborate on the project.	Platform	rejected	7	2026-07-30 06:38:19.030353+00	2026-08-15 09:54:50.65509+00	string	5	The team needs a common platform for code storage and project collaboration. No specific platform has been discussed or decided upon yet.	2026-08-15 09:54:54.242597
57	Implement Multi-Factor Authentication for Employee Accounts	Employees currently use only username and password to access the platform. We want to introduce Multi-Factor Authentication (MFA) to improve account security.	Technical	rejected	7	2026-08-08 06:39:39.408897+00	2026-08-16 13:30:09.251815+00	\N	\N	Currently, employees access the platform using only a username and password, creating a security vulnerability. To enhance account security, the organization plans to introduce Multi-Factor Authentication (MFA).	2026-08-16 13:26:04.914203
50	texting	demo	technical	approved	15	2026-08-01 11:39:49.515962+00	2026-08-01 13:20:58.23783+00	\N	\N	\N	\N
53	test decision	testing UI	Technical	draft	19	2026-08-02 22:05:40.348201+00	\N	\N	\N	\N	\N
79	Reducing Code Review and Deployment Delays	Our team's code review process is entirely manual, causing 2-day delays before every deployment.	Technical	draft	17	2026-08-16 13:42:41.853344+00	2026-08-16 13:42:53.835281+00	\N	\N	The team is facing 2-day deployment delays because of its entirely manual code review process. The problem has been identified, but no discussion or decision on a solution has occurred yet.	2026-08-16 13:43:14.141135
78	Database Optimization Meeting	We need to discuss and document indexes for query speedup and it should be feasible.	Database	draft	7	2026-08-13 19:40:35.419071+00	2026-08-17 07:22:11.275665+00	\N	\N	The organization sought to improve query speed through feasible indexing solutions. They discussed composite indexes and decided to add an index on the `created_at` field.	2026-08-17 07:22:12.105278
54	test 2 	testing dashboard	technical	approved	19	2026-08-02 23:07:01.927154+00	2026-08-05 13:12:21.458015+00	\N	\N	\N	\N
55	test decision 2	dashboard testing	Technical	draft	11	2026-08-05 18:48:27.284234+00	\N	\N	\N	\N	\N
56	texting	demooo	technical	rejected	16	2026-08-06 13:16:21.382063+00	2026-08-08 07:30:27.478798+00	\N	\N	\N	\N
49	Text	text error	technical	approved	16	2026-07-31 14:06:14.096048+00	2026-08-08 07:50:17.182775+00	\N	\N	\N	\N
58	Migrate to cloud database	Team members were using separate local databases, making collaboration difficult.	Technical	draft	7	2026-08-12 15:45:47.675709+00	\N	\N	\N	\N	\N
60	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	28	2026-08-12 16:09:48.137961+00	\N	\N	\N	\N	\N
61	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	29	2026-08-12 16:18:33.450942+00	\N	\N	\N	\N	\N
62	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	30	2026-08-12 16:25:01.373345+00	\N	\N	\N	\N	\N
63	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	31	2026-08-12 16:38:03.901891+00	\N	\N	\N	\N	\N
64	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	32	2026-08-12 16:41:52.333159+00	\N	\N	\N	\N	\N
65	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:09:15.334841+00	\N	\N	\N	\N	\N
66	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:10:08.181428+00	\N	\N	\N	\N	\N
67	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:28:49.559414+00	\N	\N	\N	\N	\N
68	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:33:05.670055+00	\N	\N	\N	\N	\N
69	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:33:43.352852+00	\N	\N	\N	\N	\N
70	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:40:46.594408+00	\N	\N	\N	\N	\N
71	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	33	2026-08-13 05:42:36.045507+00	\N	\N	\N	\N	\N
72	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	34	2026-08-13 05:45:14.032225+00	\N	\N	\N	\N	\N
73	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 05:45:28.299387+00	\N	\N	\N	\N	\N
74	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	35	2026-08-13 06:26:19.02246+00	\N	\N	\N	\N	\N
75	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	36	2026-08-13 06:29:02.019739+00	\N	\N	\N	\N	\N
76	Database Optimization Meeting	We need to discuss and document indexes for query speedup.	Database	draft	7	2026-08-13 06:29:08.235811+00	\N	\N	\N	\N	\N
77	Audit Logging Test Decision	We need to ensure audit logging is thoroughly tested.	Testing	draft	37	2026-08-13 19:40:26.368083+00	2026-08-15 11:01:52.135459+00	\N	\N	The problem identified is the need to ensure audit logging is thoroughly tested. No discussion has taken place yet to address this.	2026-08-15 11:01:57.298197
52	Adopt New Project Management Tool	Our team needs a better tool to organize project tasks and deadlines	Technical	rejected	6	2026-08-02 16:52:55.368265+00	2026-08-15 16:45:11.778711+00	string	\N	The problem identified is that the current team lacks an effective tool to organize project tasks and deadlines. A decision or discussion on implementing a better tool has not yet been made, but is recognized as a necessary step to improve project management.	2026-08-15 16:45:14.227544
59	Migrate to cloud database	Team members were using separate local databases, making collaboration difficult.	Technical	draft	7	2026-08-12 15:48:22.468911+00	2026-08-16 13:24:50.154235+00	\N	\N	Team members are struggling with collaboration due to their use of separate local databases. A discussion to address this problem has not yet occurred.	2026-08-16 13:24:55.491434
\.


--
-- Data for Name: discussion_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.discussion_messages (id, decision_id, user_id, parent_id, message, message_type, attachment_url, created_at, updated_at) FROM stdin;
2	1	11	1	discussion 1 reply	reply		2026-07-17 06:49:26.892464+00	2026-07-17 06:49:26.892464+00
1	1	11	\N	discussion1 updated	comment		2026-07-17 06:47:24.76737+00	2026-07-17 07:31:46.47214+00
3	13	7	\N	This is a comment about optimization options.	comment	\N	2026-07-18 09:31:54.119512+00	2026-07-18 09:31:54.119512+00
4	13	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-07-18 09:31:55.183285+00	2026-07-18 09:31:55.183285+00
5	14	7	\N	This is a comment about optimization options.	comment	\N	2026-07-18 09:50:50.03397+00	2026-07-18 09:50:50.03397+00
6	14	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-07-18 09:50:51.027571+00	2026-07-18 09:50:51.027571+00
7	9	11	\N	Migrate to shared cloud database	comment	\N	2026-07-18 09:59:35.721946+00	2026-07-18 09:59:35.721946+00
9	10	11	\N	Migrate to cloud database	comment	\N	2026-07-18 10:30:00.797008+00	2026-07-18 10:30:00.797008+00
10	10	11	9	eam members were using separate local databases	reply	\N	2026-07-18 10:30:43.839411+00	2026-07-18 10:30:43.839411+00
11	1	7	\N	I think we should also consider the migration timeline before finalizing this decision.	comment	string	2026-07-20 06:11:45.651526+00	2026-07-20 06:11:45.651526+00
12	1	7	1	Good point — I'll add a timeline section to the proposal.	reply	string	2026-07-20 06:13:49.09024+00	2026-07-20 06:13:49.09024+00
13	1	7	\N	Updated: we should also consider the migration timeline and rollback plan.	meeting_note	string	2026-07-20 06:15:27.687301+00	2026-07-20 06:40:27.535681+00
14	21	7	\N	This is a comment about optimization options.	comment	\N	2026-07-23 11:55:17.650564+00	2026-07-23 11:55:17.650564+00
15	21	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-07-23 11:55:18.450156+00	2026-07-23 11:55:18.450156+00
16	13	11	\N	Database Optimization Meeting	comment	/uploads/discussion/86f8a9901f1f4d9c87bd451a4feb90d0.pdf	2026-07-23 12:18:13.695243+00	2026-07-23 12:18:13.695243+00
17	25	7	\N	This is a comment about optimization options.	comment	\N	2026-07-23 16:05:13.343119+00	2026-07-23 16:05:13.343119+00
18	26	7	\N	This is a comment about optimization options.	comment	\N	2026-07-23 16:05:28.894208+00	2026-07-23 16:05:28.894208+00
19	26	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-07-23 16:05:29.51186+00	2026-07-23 16:05:29.51186+00
20	1	11	\N	manual testing is slow	meeting_note	\N	2026-07-23 16:09:25.621353+00	2026-07-23 16:09:25.621353+00
21	28	16	\N	"Our attachment pipeline processes multipart/form-data streams to persist static media files into structured server storage while recording relative static paths (attachment_url), decision context (decision_id), and author metadata (user_id) in relational storage."\r\n\r\n	comment	/uploads/discussion/4d3d6892a0314f8b88b8291fd3366fe9.png	2026-07-24 11:58:49.045507+00	2026-07-24 11:58:49.045507+00
22	22	11	\N	Binary file handling	comment	/api/uploads/03158f8bdec241639cad2d16c5b22331.pdf	2026-07-24 13:27:09.606383+00	2026-07-24 13:27:09.606383+00
23	28	11	21	updated upload feature that uses cloud storage	reply	/uploads/discussion/5bf58c096d8744e89c42c919a18a5e2a.pdf	2026-07-26 09:51:19.333773+00	2026-07-26 09:51:19.333773+00
26	30	7	\N	xyz	comment	/uploads/discussion/0be00b3997194580a5020f4fe23e8332.png	2026-07-27 06:55:35.746287+00	2026-07-27 06:55:35.746287+00
27	30	11	\N	automated testing	meeting_note	/uploads/discussion/5ba481510ee3427a8e5c2f2a767f55bc.pdf	2026-07-27 08:35:32.037202+00	2026-07-27 08:35:32.037202+00
29	29	7	\N	This is important!	meeting_note	/uploads/discussion/c75259db9eb6462d8e49ff0c2ea209f8.png	2026-07-30 14:38:43.353401+00	2026-07-30 14:38:43.353401+00
30	49	15	\N	testing	comment	\N	2026-08-01 12:09:11.561511+00	2026-08-01 12:09:11.561511+00
33	49	16	30	test	reply	\N	2026-08-01 12:10:37.529095+00	2026-08-01 12:10:37.529095+00
34	49	15	\N	test	comment	/uploads/discussion/e3de481dfbe847df98ffa37e8e1827fc.png	2026-08-01 12:12:36.154416+00	2026-08-01 12:12:36.154416+00
35	31	7	\N	Will work on it	comment	string	2026-08-04 12:31:49.740729+00	2026-08-04 12:31:49.740729+00
41	70	7	\N	This is a comment about optimization options.	comment	\N	2026-08-13 05:40:48.321782+00	2026-08-13 05:40:48.321782+00
42	70	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-08-13 05:40:49.621226+00	2026-08-13 05:40:49.621226+00
43	73	7	\N	This is a comment about optimization options.	comment	\N	2026-08-13 05:45:31.973379+00	2026-08-13 05:45:31.973379+00
44	73	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-08-13 05:45:34.021198+00	2026-08-13 05:45:34.021198+00
45	76	7	\N	This is a comment about optimization options.	comment	\N	2026-08-13 06:29:09.114289+00	2026-08-13 06:29:09.114289+00
46	76	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-08-13 06:29:09.816969+00	2026-08-13 06:29:09.816969+00
47	78	7	\N	This is a comment about optimization options.	comment	\N	2026-08-13 19:40:37.284072+00	2026-08-13 19:40:37.284072+00
48	78	7	\N	Meeting Notes 2026-07-18:\n1. Discussed composite indexes.\n2. Action item: add index on created_at.	meeting_note	\N	2026-08-13 19:40:38.184244+00	2026-08-13 19:40:38.184244+00
49	79	17	\N	GitHub Actions integrates directly with our existing GitHub repos, no extra infra needed.	comment	\N	2026-08-16 13:46:17.264598+00	2026-08-16 13:46:17.264598+00
50	78	21	\N	First let's discuss the feasible methods for optimization	comment	\N	2026-08-17 07:24:28.224622+00	2026-08-17 07:24:28.224622+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, is_read, link, created_at) FROM stdin;
13	1	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238657+00
14	10	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238659+00
15	12	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.23866+00
16	13	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.23866+00
17	4	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.23866+00
20	14	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238661+00
22	7	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238661+00
24	8	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238662+00
25	3	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238662+00
26	9	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238662+00
28	18	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238663+00
29	19	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238663+00
30	20	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	f	\N	2026-07-31 12:31:20.238663+00
31	1	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528048+00
32	10	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528051+00
33	12	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528051+00
34	13	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528052+00
35	4	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528052+00
38	14	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528053+00
40	7	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528053+00
42	8	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528054+00
43	3	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528054+00
44	9	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528054+00
46	18	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528055+00
47	19	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528055+00
48	20	New Decision Created	New decision 'text' was created by Apoorva .	info	f	\N	2026-07-31 14:06:14.528055+00
49	1	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465299+00
50	10	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465303+00
51	12	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465304+00
52	13	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465304+00
53	4	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465305+00
56	14	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465306+00
57	7	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465307+00
60	8	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465309+00
61	3	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465309+00
62	9	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465309+00
64	18	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.46531+00
65	19	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465311+00
66	20	New Decision Created	New decision 'texting' was created by isha .	info	f	\N	2026-08-01 11:39:50.465311+00
19	6	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	t	\N	2026-07-31 12:31:20.238661+00
37	6	New Decision Created	New decision 'text' was created by Apoorva .	info	t	\N	2026-07-31 14:06:14.528053+00
55	6	New Decision Created	New decision 'texting' was created by isha .	info	t	\N	2026-08-01 11:39:50.465306+00
67	1	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:12.228704+00
68	10	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:12.543905+00
69	12	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:12.866593+00
70	13	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:13.174125+00
71	4	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:13.518117+00
73	6	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:14.384072+00
74	14	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:15.102581+00
39	15	New Decision Created	New decision 'text' was created by Apoorva .	info	t	\N	2026-07-31 14:06:14.528053+00
72	5	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:09:13.82889+00
18	5	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	t	\N	2026-07-31 12:31:20.23866+00
36	5	New Decision Created	New decision 'text' was created by Apoorva .	info	t	\N	2026-07-31 14:06:14.528052+00
23	17	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	t	\N	2026-07-31 12:31:20.238662+00
41	17	New Decision Created	New decision 'text' was created by Apoorva .	info	t	\N	2026-07-31 14:06:14.528054+00
59	17	New Decision Created	New decision 'texting' was created by isha .	info	t	\N	2026-08-01 11:39:50.465308+00
27	11	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	t	\N	2026-07-31 12:31:20.238663+00
45	11	New Decision Created	New decision 'text' was created by Apoorva .	info	t	\N	2026-07-31 14:06:14.528055+00
75	7	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:15.51195+00
79	3	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:17.214558+00
83	19	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:18.858664+00
86	10	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:30.655817+00
91	6	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:32.775246+00
96	8	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:34.876544+00
101	19	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:36.596391+00
80	9	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:17.703495+00
84	20	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:19.257966+00
76	16	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:09:15.832941+00
89	4	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:31.942125+00
94	7	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:33.968685+00
105	12	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:39.006246+00
114	8	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:42.080575+00
120	20	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:44.226739+00
122	10	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:45.806288+00
125	4	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:46.928618+00
128	14	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:47.908647+00
134	9	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:49.800293+00
111	15	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:40.905528+00
108	5	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:39.97618+00
131	17	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:48.828025+00
99	11	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:35.869412+00
117	11	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:43.018056+00
88	13	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:31.48517+00
98	9	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:35.535182+00
104	10	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:38.679587+00
107	4	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:39.61424+00
110	14	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:40.593401+00
116	9	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:42.703116+00
119	19	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:43.909757+00
121	1	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:45.46966+00
124	13	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:46.611764+00
127	6	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:47.599703+00
130	7	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:48.538079+00
133	3	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:49.504355+00
93	15	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:33.557497+00
77	17	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:09:16.206183+00
113	17	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:41.595301+00
81	11	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:09:18.155599+00
78	8	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:16.648511+00
82	18	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:09:18.474635+00
85	1	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:30.211655+00
87	12	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:31.046553+00
92	14	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:33.107905+00
97	3	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:35.210181+00
100	18	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:36.233716+00
102	20	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:36.991618+00
103	1	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:38.241894+00
106	13	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:39.280349+00
109	6	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:40.251894+00
112	7	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:41.170998+00
115	3	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:42.394827+00
118	18	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:43.301548+00
123	12	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:46.124621+00
132	8	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:49.151002+00
136	18	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:50.46287+00
137	19	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:50.775768+00
138	20	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:10:51.076482+00
139	1	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:36.947601+00
140	10	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:37.259676+00
141	12	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:37.528932+00
142	13	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:37.84843+00
143	4	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:38.236837+00
145	6	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:38.944061+00
146	14	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:39.228329+00
147	7	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:39.563325+00
150	8	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:40.810394+00
151	3	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:41.079625+00
152	9	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:41.453604+00
154	18	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:42.172022+00
155	19	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:42.493753+00
156	20	New discussion comment	isha  commented on: text	NEW_DISCUSSION	f	/decisions/49	2026-08-01 12:12:42.772553+00
148	16	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:12:39.920818+00
58	16	New Decision Created	New decision 'texting' was created by isha .	info	t	\N	2026-08-01 11:39:50.465308+00
21	15	New Decision Created	New decision 'Direct File Association in Decision Workspace' was created by Apoorva .	info	t	\N	2026-07-31 12:31:20.238661+00
129	15	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:48.202161+00
144	5	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:12:38.611405+00
126	5	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:47.240008+00
90	5	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:32.336979+00
54	5	New Decision Created	New decision 'texting' was created by isha .	info	t	\N	2026-08-01 11:39:50.465305+00
157	1	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:20:59.253102+00
158	10	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:20:59.500584+00
159	12	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:20:59.756404+00
160	13	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:00.041389+00
161	4	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:00.365878+00
162	5	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:00.649602+00
163	14	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:00.895668+00
164	15	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:01.153633+00
165	7	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:01.437818+00
168	8	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:02.28568+00
169	3	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:02.54121+00
170	9	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:02.826339+00
172	18	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:03.429436+00
173	19	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:03.677624+00
174	20	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	f	/decisions/50	2026-08-01 13:21:03.937462+00
95	17	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:34.362286+00
135	11	New discussion reply	Apoorva  replied on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:10:50.120551+00
153	11	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:12:41.806797+00
171	11	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	t	/decisions/50	2026-08-01 13:21:03.145121+00
166	16	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	t	/decisions/50	2026-08-01 13:21:01.756343+00
149	17	New discussion comment	isha  commented on: text	NEW_DISCUSSION	t	/decisions/49	2026-08-01 12:12:40.473276+00
167	17	Decision approved	Admin Test approved the decision: texting	DECISION_APPROVED	t	/decisions/50	2026-08-01 13:21:02.037621+00
175	1	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:01.441454+00
176	10	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:02.360646+00
177	12	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:02.976423+00
178	13	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:03.687926+00
179	4	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:04.405531+00
180	6	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:05.014307+00
181	14	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:05.937217+00
182	15	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:06.969949+00
183	7	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:07.57912+00
185	17	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:09.529238+00
186	8	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:10.541475+00
187	3	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:11.263322+00
188	9	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:11.980821+00
190	18	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:13.61354+00
191	19	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:14.132467+00
192	20	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/51	2026-08-02 14:47:15.0533+00
193	1	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:52:56.748892+00
194	10	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:52:57.864344+00
195	12	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:52:58.995595+00
196	13	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:00.021508+00
197	4	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:01.248107+00
198	5	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:02.117623+00
199	14	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:03.120011+00
200	15	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:04.220312+00
201	7	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:04.939102+00
203	17	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:07.189199+00
204	8	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:08.411131+00
205	3	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:09.236752+00
206	9	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:10.157392+00
208	18	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:11.593117+00
209	19	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:12.616843+00
210	20	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	f	/decisions/52	2026-08-02 16:53:13.33398+00
212	1	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:52.302194+00
213	10	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:53.947564+00
214	12	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:54.967055+00
215	13	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:55.99078+00
216	4	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:57.433889+00
217	5	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:58.445199+00
218	6	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:36:59.580465+00
219	14	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:00.600016+00
220	15	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:01.727914+00
189	11	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	t	/decisions/51	2026-08-02 14:47:12.69911+00
184	16	New decision posted	Manager Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	t	/decisions/51	2026-08-02 14:47:08.606903+00
202	16	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	t	/decisions/52	2026-08-02 16:53:06.263369+00
221	7	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:02.749543+00
226	9	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:09.349163+00
230	20	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:13.301526+00
227	11	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	t	/decisions/52	2026-08-03 12:37:10.122222+00
222	16	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	t	/decisions/52	2026-08-03 12:37:03.762049+00
223	17	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:05.003859+00
224	8	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:06.631167+00
228	18	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:11.254656+00
225	3	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:08.06667+00
229	19	Decision approved	Reviewer approved the decision: Adopt New Project Management Tool	DECISION_APPROVED	f	/decisions/52	2026-08-03 12:37:12.269333+00
231	1	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:24.594719+00
232	10	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:24.986559+00
233	12	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:25.431522+00
234	13	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:25.929525+00
235	5	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:26.400951+00
236	6	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:26.806722+00
237	14	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:27.199751+00
238	15	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:27.692967+00
239	7	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:28.242273+00
241	17	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:29.116386+00
242	8	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:29.828627+00
243	3	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:30.318219+00
244	9	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:30.785581+00
246	18	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:32.001583+00
247	19	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:32.416037+00
248	20	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:32.86434+00
249	21	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	f	/decisions/54	2026-08-03 13:06:33.371899+00
250	1	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:03.554095+00
251	10	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:04.065431+00
252	12	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:04.845594+00
253	13	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:05.263916+00
254	5	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:05.664515+00
255	6	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:06.143923+00
256	14	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:06.642158+00
257	15	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:07.104414+00
258	7	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:07.53533+00
260	17	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:08.434021+00
261	8	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:08.946846+00
262	3	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:09.414705+00
263	9	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:09.886966+00
265	18	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:10.772221+00
266	19	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:11.235049+00
267	20	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:11.696665+00
268	21	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	f	/decisions/53	2026-08-03 13:11:12.095173+00
269	1	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:40.687725+00
270	10	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:41.14917+00
271	12	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:41.606418+00
272	13	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:42.12325+00
273	4	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:42.892905+00
274	5	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:43.346181+00
275	6	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:43.825464+00
276	14	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:44.298092+00
277	15	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:44.739038+00
278	7	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:45.19123+00
280	17	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:46.114831+00
240	16	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	t	/decisions/54	2026-08-03 13:06:28.714905+00
259	16	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	t	/decisions/53	2026-08-03 13:11:07.968116+00
281	8	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:46.574165+00
282	3	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:47.011552+00
283	9	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:47.507864+00
285	18	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:48.367067+00
286	19	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:48.827081+00
287	20	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	f	/decisions/28	2026-08-03 13:36:49.309868+00
211	21	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	t	/decisions/52	2026-08-02 16:53:14.352599+00
288	1	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:03.035206+00
289	10	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:03.512838+00
290	12	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:04.015791+00
291	13	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:04.46189+00
292	4	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:04.923724+00
293	6	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:05.416954+00
294	14	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:05.894976+00
295	15	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:06.373831+00
296	7	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:06.819268+00
298	17	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:07.792335+00
299	8	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:08.255213+00
300	3	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:08.717728+00
301	9	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:09.205837+00
303	18	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:10.144485+00
304	19	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:10.622814+00
305	20	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:11.10114+00
306	21	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	f	/decisions/52	2026-08-03 13:48:11.611412+00
307	1	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:47.605249+00
308	10	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:48.136317+00
309	12	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:48.683101+00
310	13	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:49.168341+00
311	4	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:49.701732+00
312	5	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:50.223547+00
313	6	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:50.73458+00
314	14	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:51.270108+00
315	15	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:51.78267+00
317	17	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:52.788098+00
318	8	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:53.314667+00
319	3	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:53.85032+00
320	9	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:54.331472+00
322	18	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:55.38026+00
297	16	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	t	/decisions/52	2026-08-03 13:48:07.282604+00
316	16	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	t	/decisions/31	2026-08-04 12:31:52.287848+00
371	4	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:22.955779+00
372	5	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:23.23577+00
374	14	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:23.82795+00
375	15	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:24.166341+00
323	19	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:55.967598+00
324	20	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:56.513071+00
325	21	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	f	/decisions/31	2026-08-04 12:31:57.09553+00
327	1	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:55.066098+00
328	10	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:55.696475+00
329	12	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:56.107313+00
330	13	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:56.747053+00
331	4	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:57.38502+00
332	5	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:58.209874+00
334	14	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:12:59.698913+00
335	15	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:00.303956+00
336	7	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:00.98451+00
338	17	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:02.415076+00
339	8	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:02.815451+00
340	3	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:03.476295+00
341	9	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:04.177459+00
343	18	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:05.287396+00
344	19	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:05.738164+00
345	20	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	f	/decisions/49	2026-08-04 13:13:06.276988+00
347	1	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:28.146651+00
348	10	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:28.529088+00
349	12	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:28.834793+00
350	13	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:29.145434+00
351	4	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:29.452909+00
352	5	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:29.763136+00
354	14	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:30.372034+00
355	15	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:30.677319+00
356	7	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:30.983627+00
358	17	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:31.595572+00
359	8	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:31.909443+00
360	3	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:32.21142+00
361	9	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:32.514322+00
362	18	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:32.828666+00
363	19	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:33.137719+00
364	20	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:33.445965+00
365	21	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	f	/decisions/55	2026-08-05 18:48:33.756587+00
63	11	New Decision Created	New decision 'texting' was created by isha .	info	t	\N	2026-08-01 11:39:50.46531+00
207	11	New decision posted	Admin Test posted a new decision: Adopt New Project Management Tool	DECISION_CREATED	t	/decisions/52	2026-08-02 16:53:10.874864+00
245	11	Decision approved	Reviewer Test approved the decision: test 2 	DECISION_APPROVED	t	/decisions/54	2026-08-03 13:06:31.262048+00
264	11	Decision approved	Reviewer Test approved the decision: test decision	DECISION_APPROVED	t	/decisions/53	2026-08-03 13:11:10.296861+00
284	11	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	t	/decisions/28	2026-08-03 13:36:47.936497+00
302	11	Decision rejected	Manager Test rejected the decision: Adopt New Project Management Tool. Reason: Implement completely	DECISION_REJECTED	t	/decisions/52	2026-08-03 13:48:09.709882+00
321	11	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	t	/decisions/31	2026-08-04 12:31:54.865498+00
342	11	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	t	/decisions/49	2026-08-04 13:13:04.687215+00
353	6	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	t	/decisions/55	2026-08-05 18:48:30.069319+00
333	6	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	t	/decisions/49	2026-08-04 13:12:58.817653+00
279	16	Decision approved	Reviewer approved the decision: Audit-Driven Decision Tracking & Contextual Analytics Platform 	DECISION_APPROVED	t	/decisions/28	2026-08-03 13:36:45.67388+00
337	16	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	t	/decisions/49	2026-08-04 13:13:01.652515+00
357	16	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	t	/decisions/55	2026-08-05 18:48:31.293816+00
367	1	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:21.662297+00
368	10	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:21.965486+00
369	12	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:22.32214+00
370	13	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:22.686017+00
376	7	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:24.453574+00
381	18	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:25.864781+00
386	11	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	t	/decisions/56	2026-08-06 13:16:27.24615+00
377	17	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:24.719108+00
382	19	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:26.118283+00
378	8	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:24.969988+00
383	20	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:26.365642+00
379	3	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:25.252066+00
384	21	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:26.658365+00
380	9	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	f	/decisions/56	2026-08-06 13:16:25.594765+00
373	6	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	t	/decisions/56	2026-08-06 13:16:23.488553+00
326	22	New discussion comment	Employee Test commented on: Adopt Automated Testing and CI/CD Pipeline	NEW_DISCUSSION	t	/decisions/31	2026-08-04 12:31:57.628954+00
346	22	Decision approved	Reviewer approved the decision: text	DECISION_APPROVED	t	/decisions/49	2026-08-04 13:13:06.897276+00
366	22	New decision posted	sahithi posted a new decision: test decision 2	DECISION_CREATED	t	/decisions/55	2026-08-05 18:48:34.076897+00
385	22	New decision submitted	Apoorva  created "texting"	DECISION_CREATED	t	/decisions/56	2026-08-06 13:16:26.990281+00
387	6	Decision Escalated	Decision 'Use GitHub for Project Collaboration' (ID 34) was flagged for escalation via AI Assistant.	escalation	f	/decisions/34	2026-08-13 08:14:06.653589+00
388	6	Decision Escalated	Decision 'Use GitHub for Project Collaboration' (ID 34) was flagged for escalation via AI Assistant.	escalation	f	/decisions/34	2026-08-15 14:48:04.27486+00
389	6	Decision Escalated	Decision 'Use GitHub for Project Collaboration' (ID 34) was flagged for escalation via AI Assistant.	escalation	f	/decisions/34	2026-08-15 16:54:21.044386+00
\.


--
-- Data for Name: reviewer_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reviewer_assignments (id, category, reviewer_id, assigned_by, created_at) FROM stdin;
1	Technical	21	6	2026-08-03 12:30:11.660402+00
2	Database	4	6	2026-08-08 07:05:54.013217+00
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, name, description, manager_id) FROM stdin;
4	Cybersecurity Team	Cybersecurity and secure decision management team	5
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.uploaded_files (id, filename, file_path, url, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, full_name, email, hashed_password, role, is_active, created_at, updated_at, team_id) FROM stdin;
7	Employee Test	mummekulsum8@gmail.com	$2b$12$Vy51Lli4VXnJBp/lYoiBMuXHyag9TGh3/fiGK5SetZUHnRZcEwWn.	employee	t	2026-07-10 03:30:48.151233+00	2026-08-11 17:06:59.268005+00	4
24	Reviewerr	reviewertest@gmail.com	$2b$12$8SUlilTKpFge9hS5FPM9L.1aiwnxlDlA0L00UXGcolLU2WdIiwXsK	reviewer	t	2026-08-07 13:07:29.594914+00	2026-08-10 04:57:31.040047+00	\N
10	Test User	testuser1@example.com	$2b$12$g2jh5j.Oi1ZQ9H65kny5l.tu0Qu03fRHOmK.c9i6Zn7znZNOGH6Qa	employee	t	2026-07-16 04:13:18.53433+00	\N	\N
12	Apoorva	apoorva12@gmail.com	$2b$12$XXC6l8stZA2cIJbi5zHfsuuY.ZOG.GiRIdKmVoX.444PMgKK3fKdq	employee	t	2026-07-17 08:00:48.643808+00	\N	\N
13	Apoorva	apoorva1234@gmail.com	$2b$12$wQRqf9uR2S1ENY4qE5FWYeTY3RqwUYYw2EWqF4mKcN9hI/pDo/0AS	employee	t	2026-07-17 08:01:00.763617+00	\N	\N
4	Reviewer Test	reviewer.test@example.com	$2b$12$XHOS0nfCn2gUXdTIv1RxYOJH2vk6Ee8x0sanfe0FqPK2tgjaU6a8G	reviewer	t	2026-07-10 03:28:59.368375+00	\N	\N
6	Admin Test	admin.test@example.com	$2b$12$PVjMV6NbEhxnrFHDJ2eoC.8y02hA7snCtZGxkM7wIMAo336txGdqG	admin	t	2026-07-10 03:30:31.505374+00	\N	\N
14	spring	spring@gmail.com	$2b$12$BNPeqifGzyJ4QRHX68a8Pu9Efu6lwBaZWQzZAunzHZRZ9h09RC6iW	manager	t	2026-07-18 10:31:54.32011+00	\N	\N
15	isha 	isha11@gmail.com	$2b$12$ZNtUlhgwmasrmFMiydQZOeXLxwfXLiP/NEozy1LGy0XdHLhwBT/mS	employee	t	2026-07-20 06:01:45.77173+00	\N	\N
16	Apoorva 	apoorva22@gmail.com	$2b$12$BQ0YqNtAtepBm3UQuyanretfiHFi9nn86b2jRr7W5NGrkmofRyhjm	employee	t	2026-07-23 06:37:03.488393+00	\N	\N
17	Kulsum	kulsum@gmail.com	$2b$12$jOwlvsl6dtBWUHu7LaZx9eCToDZWieSX/MNs6o8NPber8Pg2wIAGe	employee	t	2026-07-23 15:20:45.744725+00	\N	\N
8	Docs Test User	docstest1@example.com	$2b$12$Jk.VU7u3dUO9SElaTHUpw.OVcgRq5ET6SKBgLLCU2sG5P.yWWABG6	manager	t	2026-07-10 03:47:42.830057+00	2026-07-10 06:42:26.838366+00	\N
3	Admin User	admin@example.com	$2b$12$vS7Rqe32DIjS1P3CEAOFN.os.rNQ4c092FFIMz5kdgVDsAOTei5n.	admin	t	2026-07-10 03:08:53.301649+00	\N	\N
5	Manager Test	manager.test@example.com	$2b$12$8eSz21TU5P8hqdFU7yrwEugvjnEjNxvaJXxuuPZUXb6d0uSj87KYW	manager	t	2026-07-10 03:30:12.775742+00	2026-08-11 17:22:37.492406+00	4
25	Audit Test User	audit.test.79073f@example.com	$2b$12$3xl2npuyfLyYQa5eQB02KePVoEUG7P7MkiephBuHpL8MMHLEI9QLe	employee	t	2026-08-12 15:49:08.87142+00	\N	\N
26	Audit Test User	audit.test.ba2fd1@example.com	$2b$12$V0lUAi327hB5d3eS3vhTR.xjc97puMgJwcbtkqO9OhG3ebM4fc7dG	employee	t	2026-08-12 15:58:40.018355+00	\N	\N
9	Demo user	doctest4@example.com	$2b$12$C/uitfimqbSg852yMF4dluQA0MPIoSgSpUrXvJz6uErZ8mDQgDw8O	employee	t	2026-07-10 13:40:22.158421+00	\N	\N
27	Audit Test User	audit.test.bc3366@example.com	$2b$12$YL.4vbKCEwNbdv/3afiDY.MU4E.hcw5IjDlSsB7I6Vz5Ojal4sk1S	employee	t	2026-08-12 16:04:59.503886+00	\N	\N
28	Audit Test User	audit.test.e13b13@example.com	$2b$12$X6GpK0BOEHdEx3qjlNvGqOd3ByBm7dsvDAXo7TmH4gpxrR1YS7xU2	employee	t	2026-08-12 16:09:43.847791+00	\N	\N
29	Audit Test User	audit.test.c4dc61@example.com	$2b$12$4K/f7mugqSg.En4u9ZgG..NdOnnrzsc91yuQKiRaO/FISloGN3N4m	employee	t	2026-08-12 16:18:28.875867+00	\N	\N
30	Audit Test User	audit.test.8c39b4@example.com	$2b$12$MAwcpwrXIdxXKqYuCfTav.HCLi1TRV70Qy2wrtLh08BEesfen3XPi	employee	t	2026-08-12 16:24:58.753269+00	\N	\N
18	edrp	edrp@gmail.com	$2b$12$K8njyTmJCGtRRa2xy6mWZOYPfxRE6aPPp./iLiFzEGniaQd1nP5mW	employee	t	2026-07-26 10:04:38.04351+00	\N	\N
19	userx	userx@gmail.com	$2b$12$isMVa4iZdtefObH3wSf/Dem2AB51LEuMHiUoXEcSmr1V6WRG9r0ym	employee	t	2026-07-27 12:48:39.215583+00	\N	\N
20	Audit Test User	audit.test.6c0aed@example.com	$2b$12$NMLmhgAVL9oiHbAT3zAm6.Narz.3WSAwH.FNDQPiuqYEDTLQh12W.	employee	t	2026-07-29 12:21:57.69624+00	\N	\N
21	Reviewer	reviewer.tech@example.com	$2b$12$wVTz82JWmRe.JJ3cTvxsjOd2TPJOyTLrXM9EThQRvWV3Iq3qn7Osy	reviewer	t	2026-08-02 16:22:27.391347+00	2026-08-02 16:25:29.049158+00	\N
22	test manager	manager@gmail.com	$2b$12$pMaq4QFSHzPEAxeAmx4ma.fxaddErJprsLbHtcCVEuUHw2tJehcXe	manager	t	2026-08-03 20:07:43.071329+00	\N	\N
31	Audit Test User	audit.test.81497a@example.com	$2b$12$hQWxVFIhIXnyhh3IcW/Bee7KC2H6NhSDS07boJXOXtqHHj2wNbu26	employee	t	2026-08-12 16:38:00.089378+00	\N	\N
32	Audit Test User	audit.test.16fe3c@example.com	$2b$12$fyWIIC2z.RW8ZOaM3mqCeOioaDIcarueNmOPqRxpxSZna179MdL.O	employee	t	2026-08-12 16:41:49.51344+00	\N	\N
33	Audit Test User	audit.test.08616f@example.com	$2b$12$aVzU8qqAuZgaqpjr4Ig6FOgmgLlYNxFA0vD7xOp/Y9Dz.deQdYYjS	employee	t	2026-08-13 05:42:32.769741+00	\N	\N
11	sahithi	sahithi@gmail.com	$2b$12$LS0TxCe.8IxnhMVaoJhFOerIgObBhJ.NPUE5GLBFR0duUgMNRD63u	admin	t	2026-07-16 12:02:36.295593+00	\N	\N
34	Audit Test User	audit.test.440b74@example.com	$2b$12$IQrnH0q.d4MWeZwoupVdjO69cbEgzf.TFPTZdhEUxVWXj4kSbvGfi	employee	t	2026-08-13 05:45:11.917239+00	\N	\N
1	Cloud Test User	cloudtest2@example.com	$2b$12$GQHQl0bYcORVAsW/sdeGtOQsceLffboBh8sh53.c1CgSFG7JVXyEu	employee	t	2026-07-09 14:51:17.602708+00	2026-08-06 13:29:10.971861+00	\N
23	admin_test	admintest@gmail.com	$2b$12$T5AJSlQRUlCw92r0Qql9euOu6DKg8/.Z20JpAcE9mOqbhMb5Izia2	admin	t	2026-08-07 12:59:53.692381+00	\N	\N
35	Audit Test User	audit.test.cc8850@example.com	$2b$12$dW.tPuH.gxJv.YQxYdeUAO5HtzORxlHpwRHDi7VtT/Gau0lgBbqOq	employee	t	2026-08-13 06:26:16.902248+00	\N	\N
36	Audit Test User	audit.test.947584@example.com	$2b$12$mEJm6513dZi2sAnjimWPy.Ak7S304ksgT9PoMeMwwkmq8JjwyaErm	employee	t	2026-08-13 06:29:00.235996+00	\N	\N
37	Audit Test User	audit.test.b90511@example.com	$2b$12$jRNhVz9D7wCFQ2xiwrUq7O4eMEbpGKrHyn0ZI/vDzxfVYh5an/bKW	employee	t	2026-08-13 19:40:23.692197+00	\N	\N
\.


--
-- Name: alternatives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.alternatives_id_seq', 10, true);


--
-- Name: approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.approvals_id_seq', 47, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 2077, true);


--
-- Name: chat_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_history_id_seq', 6, true);


--
-- Name: decision_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.decision_versions_id_seq', 21, true);


--
-- Name: decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.decisions_id_seq', 79, true);


--
-- Name: discussion_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.discussion_messages_id_seq', 50, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 389, true);


--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reviewer_assignments_id_seq', 2, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.teams_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 37, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alternatives alternatives_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alternatives
    ADD CONSTRAINT alternatives_pkey PRIMARY KEY (id);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: chat_history chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_pkey PRIMARY KEY (id);


--
-- Name: decision_versions decision_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decision_versions
    ADD CONSTRAINT decision_versions_pkey PRIMARY KEY (id);


--
-- Name: decisions decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_pkey PRIMARY KEY (id);


--
-- Name: discussion_messages discussion_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: reviewer_assignments reviewer_assignments_category_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_category_key UNIQUE (category);


--
-- Name: reviewer_assignments reviewer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_pkey PRIMARY KEY (id);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: uploaded_files uploaded_files_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_alternatives_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_alternatives_id ON public.alternatives USING btree (id);


--
-- Name: ix_approvals_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_approvals_id ON public.approvals USING btree (id);


--
-- Name: ix_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_log_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_audit_logs_log_type ON public.audit_logs USING btree (log_type);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_chat_history_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_chat_history_id ON public.chat_history USING btree (id);


--
-- Name: ix_decision_versions_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_decision_versions_id ON public.decision_versions USING btree (id);


--
-- Name: ix_decisions_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_decisions_id ON public.decisions USING btree (id);


--
-- Name: ix_discussion_messages_decision_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_discussion_messages_decision_id ON public.discussion_messages USING btree (decision_id);


--
-- Name: ix_discussion_messages_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_discussion_messages_id ON public.discussion_messages USING btree (id);


--
-- Name: ix_discussion_messages_parent_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_discussion_messages_parent_id ON public.discussion_messages USING btree (parent_id);


--
-- Name: ix_discussion_messages_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_discussion_messages_user_id ON public.discussion_messages USING btree (user_id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_reviewer_assignments_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_reviewer_assignments_id ON public.reviewer_assignments USING btree (id);


--
-- Name: ix_teams_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_teams_id ON public.teams USING btree (id);


--
-- Name: ix_uploaded_files_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_uploaded_files_id ON public.uploaded_files USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: alternatives alternatives_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alternatives
    ADD CONSTRAINT alternatives_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: approvals approvals_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: approvals approvals_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_history chat_history_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: chat_history chat_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: decision_versions decision_versions_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decision_versions
    ADD CONSTRAINT decision_versions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: decision_versions decision_versions_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decision_versions
    ADD CONSTRAINT decision_versions_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: decisions decisions_assigned_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_assigned_reviewer_id_fkey FOREIGN KEY (assigned_reviewer_id) REFERENCES public.users(id);


--
-- Name: decisions decisions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: discussion_messages discussion_messages_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: discussion_messages discussion_messages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.discussion_messages(id);


--
-- Name: discussion_messages discussion_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.discussion_messages
    ADD CONSTRAINT discussion_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: teams fk_teams_manager_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT fk_teams_manager_id FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: users fk_users_team_id; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_team_id FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviewer_assignments reviewer_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: reviewer_assignments reviewer_assignments_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: uploaded_files uploaded_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict h4VTtcIsKXNZ52rsAmTE84Tx3a32Q1thdwZ2EGKBnGt7Bwdsau1bjnfpDQ8DEC8

