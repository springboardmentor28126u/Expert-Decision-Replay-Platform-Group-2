# routers/__init__.py
"""
routers/

HTTP layer only. Every route here is thin: parse the request, call a
service method, shape the response. No DB session handling beyond
`Depends(get_db)`, no business rules, no raw queries.
"""
