--
-- PostgreSQL database dump
--

\restrict UoglWaChV9lSNFjcSE2AtbGSXWyYvZr9NNHYuFjgr2iPYflJvZhfAnOyfrER1sQ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: decisionstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.decisionstatus AS ENUM (
    'DRAFT',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
);


ALTER TYPE public.decisionstatus OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: alternatives; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alternatives (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    title character varying NOT NULL,
    pros text,
    cons text,
    estimated_cost character varying,
    feasibility_notes text,
    risk_notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alternatives OWNER TO postgres;

--
-- Name: alternatives_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alternatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alternatives_id_seq OWNER TO postgres;

--
-- Name: alternatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alternatives_id_seq OWNED BY public.alternatives.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    original_filename character varying NOT NULL,
    stored_filename character varying NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attachments OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO postgres;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    decision_id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: decisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decisions (
    id integer NOT NULL,
    title character varying NOT NULL,
    problem_statement text NOT NULL,
    status public.decisionstatus NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.decisions OWNER TO postgres;

--
-- Name: decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.decisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.decisions_id_seq OWNER TO postgres;

--
-- Name: decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.decisions_id_seq OWNED BY public.decisions.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name character varying NOT NULL,
    manager_id integer
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_id_seq OWNER TO postgres;

--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    role character varying,
    team_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alternatives id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alternatives ALTER COLUMN id SET DEFAULT nextval('public.alternatives_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: decisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions ALTER COLUMN id SET DEFAULT nextval('public.decisions_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
b56732d22724
\.


--
-- Data for Name: alternatives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alternatives (id, decision_id, title, pros, cons, estimated_cost, feasibility_notes, risk_notes, created_at) FROM stdin;
1	1	Move to AWS	Scalable, widely supported	Higher learning curve	$3,000/month	Team has some AWS experience already	Migration downtime risk	2026-07-10 00:08:48.351345+05:30
2	1	Stay with current provider	\N	\N	\N	\N	\N	2026-07-10 00:11:02.444538+05:30
\.


--
-- Data for Name: attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attachments (id, decision_id, original_filename, stored_filename, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, decision_id, author_id, content, created_at) FROM stdin;
1	1	8	This is my first comment for demo	2026-07-10 01:02:13.815093+05:30
\.


--
-- Data for Name: decisions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.decisions (id, title, problem_statement, status, created_by, created_at, updated_at) FROM stdin;
1	Switch cloud provider	Our current hosting costs have doubled...	DRAFT	8	2026-07-09 23:54:43.716357+05:30	\N
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, manager_id) FROM stdin;
1	developer	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, team_id) FROM stdin;
1	Vedansh	ved@example.com	$2b$12$FaC4IN/BN3JRjGBEn.9VJ.W5GJB398fYiJx02cv561fQtFQJBwkLq	Employee	\N
5	Reviewer 1	reviewer@example.com	$2b$12$pDx1MmNqwrvCRbtaUaD9Du8eqefZtn3HwJfPyHT0.kxWADBMjm5ge	Reviewer	\N
6	Manager 1	manager@example.com	$2b$12$suSv73V6KxscfCTt4I8QLOuGjsaqROxfdJ6WkEMAMEZZkIasaeq2y	Manager	\N
7	Admin 1	admin@example.com	$2b$12$MVhQOvegHDra6.46e2RD0.SLI6gvUM9.mba/xKBBu9qw6QML0p4Cm	Administrator	\N
2	Employee 1	employee@example.com	$2b$12$iutyoBsrURlac3w8MRojbuvlG1KP9a7hoeQoZkAL8y2neN81t4Noa	Employee	1
4	Employee 1	employee@demo.com	$2b$12$VNrKENbZETzzDHxfZzfx2.w2gVm/QZNTNVRO08JEJ6wlbx7Yv614m	Employee	1
8	User 1	demo@example.com	$2b$12$GazZvbAl27GAF0ErJiqDYOTt2cxyVPlkAq6ZPU0CjSQwz3w5TCrey	Employee	\N
\.


--
-- Name: alternatives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alternatives_id_seq', 2, true);


--
-- Name: attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attachments_id_seq', 1, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, true);


--
-- Name: decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.decisions_id_seq', 1, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teams_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: alternatives alternatives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alternatives
    ADD CONSTRAINT alternatives_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_stored_filename_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_stored_filename_key UNIQUE (stored_filename);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: decisions decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_pkey PRIMARY KEY (id);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_alternatives_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_alternatives_id ON public.alternatives USING btree (id);


--
-- Name: ix_attachments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_attachments_id ON public.attachments USING btree (id);


--
-- Name: ix_comments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_comments_id ON public.comments USING btree (id);


--
-- Name: ix_decisions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_decisions_id ON public.decisions USING btree (id);


--
-- Name: ix_teams_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_teams_id ON public.teams USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: alternatives alternatives_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alternatives
    ADD CONSTRAINT alternatives_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: attachments attachments_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: comments comments_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id);


--
-- Name: decisions decisions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: teams teams_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- Name: users users_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- PostgreSQL database dump complete
--

\unrestrict UoglWaChV9lSNFjcSE2AtbGSXWyYvZr9NNHYuFjgr2iPYflJvZhfAnOyfrER1sQ

